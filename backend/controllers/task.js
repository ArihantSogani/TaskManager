const { Task, User, TaskAssignment, TaskNotification, TaskComment, TaskActivity, Label } = require('../models/sequelize');
const ROLES_LIST = require('../config/rolesList')
const { CustomError } = require('../middleware/errorHandler')
const { validateAuthInputField, validateObjectId } = require('../utils/validation')
const notificationService = require('../services/notificationService')
const notificationController = require('./notification')
const { io } = require('../server')
const { Op } = require('sequelize');


exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user.id
    console.log('[DEBUG] getAll called by userId:', userId, 'roles:', req.roles);
    
    // Migration: Update any existing "Expired" tasks to "Pending"
    try {
      await Task.update(
        { status: 'Pending' },
        { where: { status: 'Expired' } }
      )
    } catch (migrationError) {
      console.log('Migration completed or no expired tasks found')
    }
  
    // Step 1: Find all task IDs where the user is assigned
    const assignedTaskIds = await TaskAssignment.findAll({
      where: { user_id: userId },
      attributes: ['task_id'],
    });
    const taskIds = assignedTaskIds.map(a => a.task_id);

    // Step 2: Fetch all those tasks with all assigned users
    const userTasks = await Task.findAll({
      where: { id: taskIds },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    });

    const task = {
      Root: await Task.findAll({ order: [['created_at', 'DESC']], include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] }
      ] }),
      Admin: await Task.findAll({
        where: { created_by: userId }, // Only show tasks created by this admin
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'creator', attributes: ['name'] },
          { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
          { model: Label, as: 'labels', attributes: ['name'] },
          { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name','email'] }] }
        ]
      }),
      User: userTasks
    }
  
    const tasks = task[req.roles]
    console.log('[DEBUG] getAll tasks for role', req.roles, ':', Array.isArray(tasks) ? tasks.length : 'none');
    // Debug log for assignedUsers for each task (for User role)
    if (Array.isArray(req.roles) && req.roles.includes('User') && Array.isArray(tasks)) {
      tasks.forEach(t => {
        console.log(`[DEBUG] Task ID: ${t.id}, assignedUsers:`, t.assignedUsers?.map(u => u.name))
      });
    }
    if (!tasks?.length) throw new CustomError('No tasks record found', 404)

    // For each task, build a users object with all user names referenced in the activity log
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        let userIds = new Set();
        if (Array.isArray(task.activity)) {
          task.activity.forEach(act => {
            if (act.user) userIds.add(Number(act.user));
            if (act.to) userIds.add(Number(act.to));
          });
        }
        let users = {};
        task.users = users; // default empty
        if (userIds.size > 0) {
          task._userIds = Array.from(userIds); // temp property for batch fetch
        }
      });
      // Collect all unique userIds across all tasks
      const allUserIds = Array.from(new Set(tasks.flatMap(t => t._userIds || [])));
      const { User } = require('../models/sequelize');
      User.findAll({ where: { id: allUserIds }, attributes: ['id', 'name'] }).then(userList => {
        const userMap = {};
        userList.forEach(u => { userMap[Number(u.id)] = { name: u.name }; });
        tasks.forEach(task => {
          if (Array.isArray(task._userIds)) {
            task.users = {};
            task._userIds.forEach(id => {
              if (userMap[id]) {
                task.users[id] = userMap[id];
              }
            });
            delete task._userIds;
          }
        });
        res.status(200).json(tasks);
      }).catch(err => {
        tasks.forEach(task => { delete task._userIds; });
        res.status(200).json(tasks);
      });
      return; // Prevent sending the response below
    }
    res.status(200).json(tasks)
  } catch (error) {
    console.error('[DEBUG] getAll error:', error);
    next(error)
  }
}

exports.inspect = async (req, res, next) => {
  try {
    const admin_id = req.user.id
    const user_id = req.body.id
  
    if (!user_id) throw new CustomError('User id not found', 404);
    
    // Validate user_id is a valid integer
    const userId = parseInt(user_id);
    if (isNaN(userId) || userId <= 0) {
      throw new CustomError('Invalid user id format', 400);
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
  
    const tasks = await Task.findAll({
      where: { '$assignedUsers.id$': user_id },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    })
    if (!tasks?.length) throw new CustomError('No tasks record found', 404)
  
    res.status(200).json(tasks)
  } catch (error) {
    next(error)
  }
}

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params
  
    if (!id) throw new CustomError('Task id required', 400);
    
    // Validate task_id is a valid integer
    const taskId = parseInt(id);
    if (isNaN(taskId) || taskId <= 0) {
      throw new CustomError('Invalid task id format', 400);
    }
  
    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    })
    if (!task) throw new CustomError('No such task record found', 404)

    // Collect all user IDs from activity log
    let userIds = new Set();
    if (Array.isArray(task.activity)) {
      task.activity.forEach(act => {
        if (act.user) userIds.add(Number(act.user));
        if (act.to) userIds.add(Number(act.to));
      });
    }
    // Fetch user names for all referenced IDs
    let users = {};
    if (userIds.size > 0) {
      const userList = await User.findAll({ where: { id: Array.from(userIds) }, attributes: ['id', 'name'] });
      userList.forEach(u => { users[Number(u.id)] = { name: u.name }; });
    }

    // Send the task plus the users map
    res.status(200).json({ ...task.toJSON(), users });
  } catch (error) {
    next(error)
  }
}

console.log("Task.associations", Task.associations);
console.log("User.associations", User.associations);

exports.create = async (req, res, next) => {
  try {
    console.log('[CREATE TRACE 1] Start');
    console.log('[CREATE TRACE 2] User:', typeof User, User ? 'OK' : 'undefined');
    console.log('[CREATE TRACE 3] Label:', typeof Label, Label ? 'OK' : 'undefined');
    console.log('[CREATE TRACE 4] BODY:', req.body);
    console.log('[CREATE TRACE 5] FILES:', req.files);

    let { title, description, priority, due_date, assignedTo, labels } = req.body;
    console.log('[CREATE TRACE 6] Parsed req.body fields');

    // Parse labels if JSON string
    if (typeof labels === 'string') {
      try {
        labels = JSON.parse(labels);
        console.log('[CREATE TRACE 7] Parsed labels:', labels);
      } catch {
        labels = [labels];
        console.log('[CREATE TRACE 8] Labels parse failed, fallback:', labels);
      }
    }
    if (!Array.isArray(labels)) labels = [];
    console.log('[CREATE TRACE 9] After array check, labels:', labels);

    // Normalize assignedTo and convert to integers
    if (typeof assignedTo === 'string') assignedTo = [assignedTo];
    assignedTo = Array.isArray(assignedTo) ? 
      assignedTo
        .filter(Boolean)
        .map(id => parseInt(id))
        .filter(id => !isNaN(id)) : [];
    console.log('[CREATE TRACE 10] assignedTo:', assignedTo);

    validateAuthInputField({ title, description });
    console.log('[CREATE TRACE 11] Auth input validated');

    const adminId = req.user.id;
    console.log('[CREATE TRACE 12] adminId:', adminId);

    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype
      }));
      console.log('[CREATE TRACE 13] Attachments:', attachments);
    }

    // 🔨 Step 1: Create Task
    const task = await Task.create({
      title,
      description,
      created_by: adminId,
      priority: priority || 'Medium',
      due_date: due_date || null,
      attachments // ensure this field is JSON or TEXT in MySQL
    });
    console.log('[CREATE TRACE 14] Task created:', task ? task.id : 'FAILED');

    if (!task) throw new CustomError('Something went wrong during creating new task', 400);

    // 🔨 Step 2: Assign Users
    if (assignedTo.length > 0) {
      console.log('[CREATE TRACE 15] Assigning users');
      const verifyAndAssignUsers = async () => {
        // Verify all users exist before assigning
        const users = await User.findAll({
          where: {
            id: assignedTo
          }
        });
        console.log('[CREATE TRACE 16] Users found:', users.length);
        if (users.length !== assignedTo.length) {
          throw new CustomError('One or more selected users do not exist', 400);
        }
        await task.setAssignedUsers(users.map(user => user.id));
        // Notifications
        await Promise.all(users.map(user =>
          notificationService.sendNotification(user.id, {
            user_id: user.id,
            message: `You have been assigned to task "${task.title}"`,
            taskId: task.id
          })
        ));
        // Log assignment activity for each user
        let activityArr = Array.isArray(task.activity) ? [...task.activity] : [];
        users.forEach(user => {
          activityArr.push({
            type: 'assigned',
            user: adminId,
            to: user.id,
            timestamp: new Date(),
            // details: `Assigned to user ID ${user.id}`
          });
        });
        task.set('activity', activityArr);
        await task.save();
        console.log('[CREATE TRACE 17] Users assigned and notified');
      };
      await verifyAndAssignUsers();
    }

    // 🔨 Step 3: Set Labels
    console.log('[CREATE TRACE 18] Before labels block, labels:', labels);
    if (labels.length > 0) {
      console.log('[CREATE TRACE 19] Entered labels block');
      // Find or create labels
      const labelInstances = [];
      for (const labelName of labels) {
        console.log('[LABEL DEBUG] Checking/creating label:', labelName);
        let label = await Label.findOne({ where: { name: labelName } });
        console.log('[LABEL DEBUG] Label findOne result:', label);
        if (!label) {
          label = await Label.create({ name: labelName, created_by: adminId });
          console.log('[LABEL DEBUG] Created new label:', label);
        }
        labelInstances.push(label);
      }
      // Debug log before setLabels
      console.log('[CREATE TRACE 23] task.setLabels exists:', typeof task.setLabels);
      // Update task labels association
      await task.setLabels(labelInstances);
      console.log('[CREATE TRACE 24] setLabels completed');
    }

    // 🔍 Step 4: Populate (eager load associations)
    console.log('[CREATE TRACE 25] Before populate task');
    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] }
      ]
    }).catch(err => {
        console.error('[CREATE TRACE 26] Failed to populate task with associations:', err);
        throw new CustomError('Failed to load newly created task', 500);
    });
    console.log('[CREATE TRACE 27] Populated task:', populatedTask ? populatedTask.id : 'FAILED');

    res.status(201).json(populatedTask);
    console.log('[CREATE TRACE 28] Response sent');
  } catch (error) {
    console.error('[CREATE TRACE ERROR]', error);
    next(error);
  }
};



exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, assignedTo } = req.body
    
    if (!id) throw new CustomError('Task id required', 400);
    
    // Validate task_id is a valid integer
    const taskId = parseInt(id);
    if (isNaN(taskId) || taskId <= 0) {
      throw new CustomError('Invalid task id format', 400);
    }

    // Handle assignedTo if present
    if (assignedTo) {
      // Convert to array and validate IDs
      const assignedUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      
      // Validate and parse all user IDs
      const validatedUserIds = assignedUsers
        .filter(Boolean)
        .map(id => {
          const parsedId = parseInt(id);
          if (isNaN(parsedId) || parsedId <= 0) {
            throw new CustomError('Invalid user id format in assignedTo', 400);
          }
          return parsedId;
        });

      // Check if all assigned users exist
      if (validatedUserIds.length > 0) {
        const checkUsers = async () => {
          const users = await User.findAll({
            where: {
              id: validatedUserIds
            }
          });

          if (users.length !== validatedUserIds.length) {
            throw new CustomError('One or more assigned users not found', 404);
          }

          // Update the assignedTo field with validated IDs
          req.body.assignedTo = validatedUserIds;
        };
        await checkUsers();
      }
    }
  
    const ownerId = req.user.id
    let task = await Task.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['name'] }]
    })
    if (!task) throw new CustomError('No such task record found', 404)

    // Get assigned users
    const taskWithAssignees = await Task.findByPk(id, {
      include: [{ model: User, as: 'assignedUsers' }]
    });

    // Check authorization
    const isAssignedUser = taskWithAssignees.assignedUsers
      .map(user => user.id.toString())
      .includes(ownerId.toString())
    const isAdmin = req.roles.includes(ROLES_LIST.Admin)
    const isRoot = req.roles.includes(ROLES_LIST.Root)
    const isOwner = isAdmin && task.created_by.toString() === ownerId.toString()
    
    // For non-admin users, only allow updates if they are assigned to the task
    if (!isAdmin && !isRoot) {
      if (!isAssignedUser) {
        throw new CustomError('Not authorized to update this task', 401)
      }
      // Non-admin users can update status, title, description, and labels
      if (Object.keys(req.body).some(key => !['status', 'title', 'description', 'labels'].includes(key))) {
        throw new CustomError('You can only update the task status, title, description, or labels', 400)
      }
    }

    // If it's a status update, validate the status
    if (status && !['Pending', 'In Progress', 'Completed', 'On Hold'].includes(status)) {
      throw new CustomError('Invalid status value', 400)
    }

    // Log label updates for debugging
    if (req.body.labels && Array.isArray(req.body.labels)) {
      console.log('Updating labels in task:', req.body.labels)
    }

    // Track changes for activity logging
    const changes = [];
    if (typeof req.body.title === 'string' && req.body.title !== task.title) {
      changes.push({ type: 'edit', field: 'title', oldValue: task.title, newValue: req.body.title });
    }
    if (typeof req.body.description === 'string' && req.body.description !== task.description) {
      changes.push({ type: 'edit', field: 'description', oldValue: task.description, newValue: req.body.description });
    }

    // Get current labels for comparison
    const currentTask = await Task.findByPk(taskId, {
      include: [{ model: Label, as: 'labels', attributes: ['name'] }]
    });
    const currentLabels = currentTask.labels.map(label => label.name);
    
    if (Array.isArray(req.body.labels) && JSON.stringify(req.body.labels.sort()) !== JSON.stringify(currentLabels.sort())) {
      // Log label change as its own activity type
      changes.push({ type: 'label', field: 'labels', oldValue: currentLabels, newValue: req.body.labels });
    }

    // Log status change activity (before updating the task)
    if (typeof req.body.status === 'string' && req.body.status !== task.status) {
      const statusActivity = {
        type: 'status',
        user: ownerId,
        status: req.body.status,
        oldValue: task.status,
      };
      changes.push(statusActivity);
    }

    // Update the task (excluding labels which will be handled separately)
    const { labels, ...updateData } = req.body;
    await task.update({
      ...updateData,
      ...(status === 'Completed' ? { completed_at: new Date() } : {})
    });

    // Handle label updates using association
    if (Array.isArray(labels)) {
      // Find or create labels
      const labelInstances = [];
      for (const labelName of labels) {
        let label = await Label.findOne({ where: { name: labelName } });
        if (!label) {
          label = await Label.create({ name: labelName, created_by: ownerId });
        }
        labelInstances.push(label);
      }
      // Update task labels association
      await task.setLabels(labelInstances);
    }

    // Save activity log for all changes
    if (changes.length > 0) {
      let activityArr = Array.isArray(task.activity) ? [...task.activity] : [];
      changes.forEach(change => {
        let details = '';
        let socketMsg = '';
        if (change.type === 'edit') {
          details = `${change.field.charAt(0).toUpperCase() + change.field.slice(1)} changed from \"${change.oldValue}\" to \"${change.newValue}\"`;
          socketMsg = `${change.field.charAt(0).toUpperCase() + change.field.slice(1)} updated: \"${change.oldValue}\" → \"${change.newValue}\"`;
        } else if (change.type === 'label') {
          details = `Labels changed from \"${(change.oldValue || []).join(', ')}\" to \"${(change.newValue || []).join(', ')}\"`;
          socketMsg = `Labels updated: \"${(change.oldValue || []).join(', ')}\" → \"${(change.newValue || []).join(', ')}\"`;
        } else if (change.type === 'status') {
          details = `Status changed from \"${change.oldValue}\" to \"${change.status}\"`;
          socketMsg = `Status updated: \"${change.oldValue}\" → \"${change.status}\"`;
        }
        activityArr.push({
          ...change,
          user: ownerId,
          timestamp: new Date(),
          details
        });
        // Emit socket event for this change
        if (socketMsg) {
          // Get all assigned users and creator
          const notifyUsers = [
            ...(taskWithAssignees.assignedUsers?.map(u => u.id.toString()) || []),
            task.created_by?.toString()
          ].filter(Boolean);
          notifyUsers.forEach(userId => {
            io.to(userId).emit('task-updated', {
              taskId: task.id,
              message: socketMsg,
              field: change.field || change.type,
              by: ownerId
            });
          });
        }
      });
      task.set('activity', activityArr);
      await task.save();
    }

    // Send notification if status is updated
    if (status && status !== task.status) {
      // Get the name of the user who made the update
      const updatedBy = isAdmin ? 'Admin' : task.assignedUsers.find(user => 
        user.id.toString() === ownerId.toString()
      )?.name || 'A user'

      const notification = {
        message: `Task "${task.title}" status updated to ${status} by ${updatedBy}`,
        taskId: task.id,
        status,
        updatedBy: {
          id: ownerId,
          name: updatedBy
        }
      }
      // Notify assigned users and task creator (except the user who made the update)
      const notifyUsers = [
        ...(Array.isArray(task.assignedUsers) ? task.assignedUsers.map(u => u.id) : []),
        task.created_by
      ].filter(userId => userId !== undefined && userId !== null && userId.toString() !== ownerId.toString());
      await Promise.all(notifyUsers.map(userId => 
        notificationService.sendTaskUpdate(userId, notification)
      ))
    }

    // Notify all relevant users (assigned, creator, etc.)
    const updatedTask = await Task.findByPk(taskId, {
      attributes: { include: ['activity'] },
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    });
    const notifyUsers = [
      ...(updatedTask.assignedUsers?.map(u => u.id?.toString()) || []),
      updatedTask.creator?.id?.toString()
    ].filter(Boolean);
    notifyUsers.forEach(userId => {
      io.to(userId).emit('task-updated', updatedTask);
    });

    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('[DELETE TASK] Task ID:', id);

    if (!id) throw new CustomError('Task id required', 400);
    
    // Validate task_id is a valid integer
    const taskId = parseInt(id);
    if (isNaN(taskId) || taskId <= 0) {
      throw new CustomError('Invalid task id format', 400);
    }
    
    const ownerId = req.user.id;
    const task = await Task.findByPk(taskId);
    if (!task) throw new CustomError('No such task record found', 404);

    const owner = req.roles.includes(ROLES_LIST.Admin) && (task.created_by.toString() === ownerId.toString());
    const deleteRight = owner || req.roles.includes(ROLES_LIST.Root);
    if(!deleteRight) throw new CustomError('Not authorized to delete this task', 401);
  
    await task.destroy();
    console.log('[DELETE TASK] Task deleted from DB:', id);

    // Try to fetch task with users (will be null after deletion)
    const taskWithUsersForSocket = await Task.findByPk(id, {
      include: [{ model: User, as: 'assignedUsers' }]
    });

    if (taskWithUsersForSocket && taskWithUsersForSocket.assignedUsers) {
      const notifyUsersDelete = [
        ...(taskWithUsersForSocket.assignedUsers?.map(u => u.id.toString()) || []),
        taskWithUsersForSocket.created_by?.toString()
      ].filter(Boolean);
      notifyUsersDelete.forEach(userId => {
        io.to(userId).emit('task-deleted', id.toString());
      });
      console.log('[DELETE TASK] Notified users:', notifyUsersDelete);
    } else {
      console.log('[DELETE TASK] No users to notify for deleted task:', id);
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('[DELETE TASK ERROR]', error);
    next(error);
  }
};

exports.getAssignUser = async (req, res, next) => {
  try {
    const { id } = req.params
  
    validateObjectId(id, 'Task')
  
    const task = await Task.findByPk(id, {
      include: [{
        model: User,
        as: 'assignedUsers',
        attributes: ['id', 'name']
      }]
    })
    if(!task) throw new CustomError('Task not found', 404)
    if(!task.assignedUsers.length) throw new CustomError('No users assigned to this task', 400)
    
    res.status(200).json({ assignedUsers: task.assignedUsers })
  } catch (error) {
    next(error)
  }
}

exports.assignUser = async (req, res, next) => {
  try {
    const { task_id, user_id } = req.body
    console.log('[ASSIGN DEBUG] Received user_id:', user_id, 'Type:', typeof user_id, 'IsArray:', Array.isArray(user_id));
  
    if (!task_id) throw new CustomError('Task id required', 400);
    if (!Array.isArray(user_id) || user_id.length === 0) {
      throw new CustomError('User ids are required', 400);
    }

    // Validate and parse all user IDs
    const userIds = user_id.map(id => {
      const parsedId = parseInt(id);
      if (isNaN(parsedId) || parsedId <= 0) {
        throw new CustomError('Invalid user id format', 400);
      }
      return parsedId;
    });

    // Check if all users exist
    const checkUsers = async () => {
      const users = await User.findAll({
        where: {
          id: userIds
        }
      });

      if (users.length !== userIds.length) {
        throw new CustomError('One or more users not found', 404);
      }
      return users;
    };
    const users = await checkUsers();
  
    const ownerId = req.user.id
    const task = await Task.findByPk(task_id)
    if (!task) throw new CustomError('Task not found', 404)

    // Get current assignees
    const taskWithAssignees = await Task.findByPk(task_id, {
      include: [{ model: User, as: 'assignedUsers' }]
    });

    // Allow current assignee or admin/root
    const isCurrentAssignee = taskWithAssignees.assignedUsers.some(u => u.id.toString() === ownerId.toString());
    const isAdmin = req.roles && (req.roles.includes('Admin') || req.roles.includes('Root'));
    if (!isCurrentAssignee && !isAdmin) throw new CustomError('Only the current assignee or an admin can reassign this task', 401)

    let prevAssigneeUser = null;
    let newAssigneeUser = null;

    if (isAdmin) {
      // Admin: assign to any set of users
      await task.setAssignedUsers(user_id);
      // Log activity for admin assignment/reassignment
      await TaskActivity.create({
        task_id: task_id,
        activity_type: 'assigned', // FIXED: was 'type'
        user_id: ownerId,
        to_user_id: user_id[0],
        timestamp: new Date()
      });
    } else {
      // User: can only replace their own assignment
      if (user_id.length !== 1) throw new CustomError('You can only reassign to one user at a time', 400);
      
      // Remove current user and add new user
      await task.removeAssignedUser(ownerId);
      await task.addAssignedUser(user_id[0]);
      
      prevAssigneeUser = await User.findByPk(ownerId, { attributes: ['name'] });
      newAssigneeUser = await User.findByPk(user_id[0], { attributes: ['name'] });
      // Log activity for this reassignment
      const newAssignActivity = {
        type: 'assigned',
        user: ownerId,
        to: user_id[0],
        timestamp: new Date(),
        // details: `Task reassigned from ${prevAssigneeUser?.name || ownerId} to ${newAssigneeUser?.name || user_id[0]}`
      };
      const updatedAssignActivity = Array.isArray(task.activity) ? [...task.activity, newAssignActivity] : [newAssignActivity];
      task.set('activity', updatedAssignActivity);
      await task.save();
    }

    // Create notifications for newly assigned users
    const notification = {
      message: `You have been assigned to task "${task.title}"`,
      taskId: task.id
    }
    await Promise.all(user_id.map(userId => 
      notificationService.sendNotification(userId, notification)
    ))

    const updatedTask = await Task.findByPk(task_id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    })
    
    // Notify all relevant users (assigned, creator, etc.)
    const notifyUsersAssign = [
      ...(updatedTask.assignedUsers?.map(u => u.id?.toString()) || []),
      updatedTask.creator?.id?.toString()
    ].filter(Boolean);
    notifyUsersAssign.forEach(userId => {
      io.to(userId).emit('task-updated', updatedTask);
    });
    
    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.deleteAssign = async (req, res, next) => {
  try {
    const { id } = req.params
    const { user_id } = req.body
  
    if (!id) throw new CustomError('Task id required', 400);
    if (!user_id) throw new CustomError('User id required', 400);

    // Validate task_id and user_id are valid integers
    const taskId = parseInt(id);
    const userId = parseInt(user_id);

    if (isNaN(taskId) || taskId <= 0) {
      throw new CustomError('Invalid task id format', 400);
    }
    if (isNaN(userId) || userId <= 0) {
      throw new CustomError('Invalid user id format', 400);
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    
    const ownerId = req.user.id
    const task = await Task.findByPk(id)
    if (!task) throw new CustomError('Task not found', 404)

    const owner = req.roles.includes(ROLES_LIST.Admin) && (task.created_by.toString() === ownerId.toString())
    const deleteRight = owner || req.roles.includes(ROLES_LIST.Root)
    if(!deleteRight) throw new CustomError('Not authorized to remove assignment', 401)

    await task.removeAssignedUser(user_id);
    
    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    });

    if (!updatedTask) throw new CustomError("Failed to update task", 400)

    // Notify user about assignment removal
    const notification = {
      message: `You have been removed from task "${task.title}"`,
      taskId: task.id
    }
    
    await notificationService.sendNotification(user_id, notification)
  
    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { text } = req.body
    const userId = req.user.id

    // Validate task_id is a valid integer
    const taskId = parseInt(id);
    if (isNaN(taskId) || taskId <= 0) {
      throw new CustomError('Invalid task id format', 400);
    }
    
    if (!text) throw new CustomError('Comment text is required', 400)

    const task = await Task.findByPk(taskId)
    if (!task) throw new CustomError('Task not found', 404)

    // Create comment using the TaskComment model
    const comment = await TaskComment.create({
      task_id: taskId,
      user_id: userId,
      text: text
    });

    // Notify all users involved in the task
    const notification = {
      message: `New comment on task "${task.title}"`,
      taskId: task.id,
      commentId: comment.id
    }

    // Get task with assigned users for notifications
    const taskWithUsers = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'assignedUsers', attributes: ['id'] }]
    });

    const notifyUsers = [...new Set([...taskWithUsers.assignedUsers.map(u => u.id), task.created_by])]
      .filter(id => id.toString() !== userId.toString())

    await Promise.all(notifyUsers.map(userId => 
      notificationService.sendTaskComment([userId], notification)
    ))

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] },
        { model: User, as: 'assignedUsers', attributes: ['id', 'name'] },
        { model: Label, as: 'labels', attributes: ['name'] },
        { model: TaskComment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ]
    })

    // Emit socket event for real-time update
    const notifyUsersSocket = [
      ...(updatedTask.assignedUsers?.map(u => u.id?.toString()) || []),
      updatedTask.creator?.id?.toString() || (typeof updatedTask.created_by === 'number' ? updatedTask.created_by.toString() : null)
    ].filter(Boolean);
    notifyUsersSocket.forEach(userId => {
      io.to(userId).emit('task-updated', updatedTask);
    });

    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id

    const tasks = await Task.findAll({
      where: {
         [Op.or]: [
          { assignedTo: userId },
          { created_by: userId }
        ]
      },
      attributes: ['notifications']
    })
    .then(tasks => tasks.map(task => task.notifications).flat());

    const notifications = tasks.filter(n => 
      n.user.toString() === userId.toString() && !n.read
    );

    res.status(200).json(notifications)
  } catch (error) {
    next(error)
  }
}

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { taskId, notificationId } = req.params
    const userId = req.user.id

    validateObjectId(taskId, 'Task')
    validateObjectId(notificationId, 'Notification')

    const task = await Task.findByPk(taskId)
    if (!task) throw new CustomError('Task not found', 404)

    const success = await task.markNotificationAsRead(userId, notificationId)
    if (!success) throw new CustomError('Notification not found or unauthorized', 404)

    res.status(200).json({ message: 'Notification marked as read' })
  } catch (error) {
    next(error)
  }
}

exports.getUnassignedUsers = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
  
    validateObjectId(taskId, 'Task')
  
    // Fetch task with assigned users (Sequelize association)
    const task = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'assignedUsers', attributes: ['id'] }]
    });
    if (!task) throw new CustomError('Task not found', 404)

    // Allow current assignee or admin/root
    const ownerId = req.user.id;
    const assignedUserIds = task.assignedUsers.map(u => u.id);
    console.log('assignedUserIds:', assignedUserIds, 'ownerId:', ownerId);
    const isCurrentAssignee = assignedUserIds.some(id => id.toString() === ownerId.toString());
    const isAdmin = req.roles && (req.roles.includes('Admin') || req.roles.includes('Root'));
    console.log('isCurrentAssignee:', isCurrentAssignee, 'isAdmin:', isAdmin);
    if (!isCurrentAssignee && !isAdmin) throw new CustomError('Only the current assignee or an admin can reassign this task', 401)

    // Allow all active users (including Admins) except those already assigned
    const unassignedUsers = await User.findAll({
      where: {
        id: { [Op.notIn]: assignedUserIds },
        active: true
      },
      attributes: ['id', 'name', 'email', 'roles'] // <-- include 'id'
    });

    if (!unassignedUsers?.length) throw new CustomError('No unassigned users found', 404)
    
    res.status(200).json(unassignedUsers)
  } catch (error) {
    next(error)
  }
}

// Get all unique labels from existing tasks
exports.getAllLabels = async (req, res, next) => {
  try {
    console.log('Fetching all unique labels from tasks...')
    
    // Get all unique labels from the labels table
    console.log('[LABEL DEBUG] Fetching all labels from Label table...');
    const labels = await Label.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']]
    });
    console.log('[LABEL DEBUG] Labels found:', labels.map(l => l.name));
    
    const labelOptions = labels.map(label => ({
      value: label.name,
      label: label.name
    }))
    
    console.log('[LABEL DEBUG] Sending label options:', labelOptions)
    res.status(200).json(labelOptions)
  } catch (error) {
    console.error('Error fetching labels:', error)
    next(error)
  }
}
