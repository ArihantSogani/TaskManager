const Task = require('../models/Task')
const User = require('../models/user/User')
const ROLES_LIST = require('../config/rolesList')
const { CustomError } = require('../middleware/errorHandler')
const { validateAuthInputField, validateObjectId } = require('../utils/validation')
const notificationService = require('../services/notificationService')
const notificationController = require('./notification')

// const pushNotificationService = require('../services/pushNotificationService')

exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user._id
    
    // Migration: Update any existing "Expired" tasks to "Pending"
    try {
      await Task.updateMany(
        { status: 'Expired' },
        { status: 'Pending' }
      )
    } catch (migrationError) {
      console.log('Migration completed or no expired tasks found')
    }
  
    const task = {
      Root: await Task.find().sort({ createdAt: -1 })
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('comments.user', 'name')
        .populate('activity.user', 'name')
        .populate('activity.to', 'name')
        .lean(),
      Admin: await Task.find({ $or: [{ createdBy: userId }, { assignedTo: userId }] })
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('comments.user', 'name')
        .populate('activity.user', 'name')
        .populate('activity.to', 'name')
        .sort({ createdAt: -1 })
        .lean(),
      User: await Task.find({ assignedTo: userId })
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .populate('comments.user', 'name')
        .populate('activity.user', 'name')
        .populate('activity.to', 'name')
        .sort({ createdAt: -1 })
        .lean()
    }
  
    const tasks = task[req.roles]
  
    if (!tasks?.length) throw new CustomError('No tasks record found', 404)
    res.status(200).json(tasks)
  } catch (error) {
    next(error)
  }
}

exports.inspect = async (req, res, next) => {
  try {
    const admin_id = req.user._id
    const user_id = req.body.id
  
    validateObjectId(user_id, 'Task')
    if(!user_id && (admin_id === user_id)) throw new CustomError('User id not found', 404)
  
    const tasks = await Task.find({ assignedTo: user_id }).sort({ createdAt: -1 }).populate('createdBy', 'name').populate('assignedTo', 'name').lean()
    if (!tasks?.length) throw new CustomError('No tasks record found', 404)
  
    res.status(200).json(tasks)
  } catch (error) {
    next(error)
  }
}

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params
  
    validateObjectId(id, 'Task')
  
    const task = await Task.findById(id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .populate('comments.user', 'name')
      .populate('activity.user', 'name')
      .populate('activity.to', 'name')
      .lean()
      .exec()
    if (!task) throw new CustomError('No such task record found', 404)
  
    res.status(200).json(task)
  } catch (error) {
    next(error)
  }
}

exports.create = async (req, res, next) => {
  try { 
    console.log('--- CREATE TASK CONTROLLER CALLED ---');
    console.log('BODY:', req.body);
    console.log('FILES:', req.files);
    let { title, description, priority, dueDate, assignedTo, labels } = req.body;
    // Parse labels if sent as JSON string
    if (typeof labels === 'string') {
      try {
        labels = JSON.parse(labels);
      } catch {
        labels = [labels];
      }
    }
    if (!Array.isArray(labels)) labels = [];

    if (typeof assignedTo === 'string') assignedTo = [assignedTo];
    if (Array.isArray(assignedTo)) {
      assignedTo = assignedTo.filter(Boolean);
    } else {
      assignedTo = [];
    }

    validateAuthInputField({ title, description });
    const adminId = req.user._id;

    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype
      }));
    }

    // Debug log for labels
    console.log('Labels to be saved in task:', labels);

    const task = await Task.create({
      title,
      description,
      createdBy: adminId,
      assignedTo: assignedTo || [],
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      labels: labels || [],
      attachments
    });
    if (!task) throw new CustomError('Something went wrong, during creating new task', 400);

    // Create notifications for assigned users if any
    if (assignedTo && assignedTo.length > 0) {
      const notification = {
        message: `You have been assigned to task "${task.title}"`,
        taskId: task._id
      }
      await Promise.all(assignedTo.map(userId => 
        notificationService.sendNotification(userId, notification)
      ))
    }

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .lean()

    res.status(201).json(populatedTask)
  } catch (error) {
    next(error)
  }
}

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    validateObjectId(id, 'Task')
  
    const ownerId = req.user._id
    const task = await Task.findById(id).populate('assignedTo', 'name').exec()
    if (!task) throw new CustomError('No such task record found', 404)

    // Debug logs
    console.log('ownerId:', ownerId.toString())
    console.log('task.assignedTo:', task.assignedTo.map(user => user._id.toString()))

    // Check authorization
    const isAssignedUser = task.assignedTo.map(user => user._id.toString()).includes(ownerId.toString())
    const isAdmin = req.roles.includes(ROLES_LIST.Admin)
    const isRoot = req.roles.includes(ROLES_LIST.Root)
    const isOwner = isAdmin && task.createdBy.toString() === ownerId.toString()
    
    // For non-admin users, only allow status updates if they are assigned to the task
    if (!isAdmin && !isRoot) {
      if (!isAssignedUser) {
        throw new CustomError('Not authorized to update this task', 401)
      }
      // Non-admin users can only update status
      if (Object.keys(req.body).some(key => key !== 'status')) {
        throw new CustomError('You can only update the task status', 400)
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

    // Update the task
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id },
      { 
        ...req.body,
        ...(status === 'Completed' ? { completedAt: new Date() } : {})
      },
      { new: true }
    )
    .populate('createdBy', 'name')
    .populate('assignedTo', 'name')
    .lean()

    if (!updatedTask) {
      throw new CustomError('Failed to update task', 400)
    }

    // Log status change activity
    if (status && status !== task.status) {
      task.activity.push({
        type: 'status',
        user: ownerId,
        status: status,
        timestamp: new Date(),
        details: `Status changed to ${status}`
      });
      await task.save();
    }

    // Send notification if status is updated
    if (status && status !== task.status) {
      // Get the name of the user who made the update
      const updatedBy = isAdmin ? 'Admin' : task.assignedTo.find(user => 
        user._id.toString() === ownerId.toString()
      )?.name || 'A user'

      const notification = {
        message: `Task "${task.title}" status updated to ${status} by ${updatedBy}`,
        taskId: task._id,
        status,
        updatedBy: {
          id: ownerId,
          name: updatedBy
        }
      }
      
      // Notify assigned users and task creator (except the user who made the update)
      const notifyUsers = [...task.assignedTo.map(u => u._id), task.createdBy]
        .filter(userId => userId.toString() !== ownerId.toString())
      
      await Promise.all(notifyUsers.map(userId => 
        notificationService.sendTaskUpdate(userId, notification)
      ))
    }
  
    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params
  
    validateObjectId(id, 'Task')
    
    const ownerId = req.user._id
    const task = await Task.findById(id).exec()
    if (!task) throw new CustomError('No such task record found', 404)

    const owner = req.roles.includes(ROLES_LIST.Admin) && (task.createdBy.toString() === ownerId.toString())
    const deleteRight = owner || req.roles.includes(ROLES_LIST.Root)
    if(!deleteRight) throw new CustomError('Not authorized to delete this task', 401)
  
    await task.remove()

    // Notify assigned users about task deletion
    const notification = {
      message: `Task "${task.title}" has been deleted`,
      taskId: task._id
    }
    
    await Promise.all(task.assignedTo.map(userId => 
      notificationService.sendNotification(userId, notification)
    ))
  
    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (error) {
    next(error)
  }
}

exports.getAssignUser = async (req, res, next) => {
  try {
    const { id } = req.params
  
    validateObjectId(id, 'Task')
  
    const tasks = await Task.findById(id).populate('assignedTo', 'name').select('assignedTo').lean().exec()
    if(!tasks) throw new CustomError('Not assigned to user', 400)
    
    res.status(200).json(tasks)
  } catch (error) {
    next(error)
  }
}

exports.assignUser = async (req, res, next) => {
  try {
    const { task_id, user_id } = req.body
  
    validateObjectId(task_id, 'Task')
    user_id.map(id => validateObjectId(id, 'User'))
  
    const ownerId = req.user._id
    const task = await Task.findById(task_id).exec()
    if (!task) throw new CustomError('Task not found', 404)

    // Allow current assignee or admin/root
    console.log('assignedTo:', task.assignedTo, 'ownerId:', ownerId);
    const isCurrentAssignee = task.assignedTo.some(u =>
      (u._id ? u._id.toString() : u.toString()) === ownerId.toString()
    );
    const isAdmin = req.roles && (req.roles.includes('Admin') || req.roles.includes('Root'));
    console.log('isCurrentAssignee:', isCurrentAssignee, 'isAdmin:', isAdmin);
    if (!isCurrentAssignee && !isAdmin) throw new CustomError('Only the current assignee or an admin can reassign this task', 401)

    let prevAssigneeUser = null;
    let newAssigneeUser = null;

    if (isAdmin) {
      // Admin: assign to any set of users
      const prevAssignees = Array.isArray(task.assignedTo) ? task.assignedTo.map(u => u.toString()) : [];
      task.assignedTo = user_id;
      // Log activity for admin assignment/reassignment
      task.activity.push({
        type: 'assigned',
        user: ownerId,
        to: user_id,
        timestamp: new Date(),
        details: `Admin reassigned task from: ${prevAssignees.join(', ')} to: ${user_id.join(', ')}`
      });
      await task.save();
      prevAssigneeUser = null;
      newAssigneeUser = null;
    } else {
      // User: can only replace their own assignment
      if (user_id.length !== 1) throw new CustomError('You can only reassign to one user at a time', 400);
      const idx = task.assignedTo.findIndex(u => u.toString() === ownerId.toString());
      if (idx === -1) throw new CustomError('You are not assigned to this task', 401);
      prevAssigneeUser = await User.findById(ownerId).select('name').lean();
      newAssigneeUser = await User.findById(user_id[0]).select('name').lean();
      task.assignedTo[idx] = user_id[0];
      await task.save();
      // Log activity for this reassignment
      task.activity.push({
        type: 'assigned',
        user: ownerId,
        to: user_id[0],
        timestamp: new Date(),
        details: `Task reassigned from ${prevAssigneeUser?.name || ownerId} to ${newAssigneeUser?.name || user_id[0]}`
      });
      await task.save();
    }

    // Create notifications for newly assigned users
    const notification = {
      message: `You have been assigned to task "${task.title}"`,
      taskId: task._id
    }
    await Promise.all(user_id.map(userId => 
      notificationService.sendNotification(userId, notification)
    ))

    const updatedTask = await Task.findById(task_id)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .lean()
    
    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.deleteAssign = async (req, res, next) => {
  try {
    const { id } = req.params
    const { user_id } = req.body
  
    validateObjectId(id, 'Task')
    validateObjectId(user_id, 'User')
    
    const ownerId = req.user._id
    const task = await Task.findById(id).exec()
    if (!task) throw new CustomError('Task not found', 404)

    const owner = req.roles.includes(ROLES_LIST.Admin) && (task.createdBy.toString() === ownerId.toString())
    const deleteRight = owner || req.roles.includes(ROLES_LIST.Root)
    if(!deleteRight) throw new CustomError('Not authorized to remove assignment', 401)

    const updatedTask = await Task.findByIdAndUpdate(
      id, 
      { $pull: { assignedTo: user_id }},
      { new: true }
    ).populate('assignedTo', 'name').populate('createdBy', 'name').lean()

    if (!updatedTask) throw new CustomError("Failed to update task", 400)

    // Notify user about assignment removal
    const notification = {
      message: `You have been removed from task "${task.title}"`,
      taskId: task._id
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
    const userId = req.user._id

    validateObjectId(id, 'Task')
    if (!text) throw new CustomError('Comment text is required', 400)

    const task = await Task.findById(id).exec()
    if (!task) throw new CustomError('Task not found', 404)

    // Add comment
    task.comments.push({
      user: userId,
      text
    })
    await task.save()

    // Notify all users involved in the task
    const notification = {
      message: `New comment on task "${task.title}"`,
      taskId: task._id,
      commentId: task.comments[task.comments.length - 1]._id
    }

    const notifyUsers = [...new Set([...task.assignedTo, task.createdBy])]
      .filter(id => id.toString() !== userId.toString())

    await Promise.all(notifyUsers.map(userId => 
      notificationService.sendTaskComment([userId], notification)
    ))

    const updatedTask = await Task.findById(id)
      .populate('comments.user', 'name')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .lean()

    res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id

    const tasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { createdBy: userId }
      ]
    })
    .select('notifications')
    .where('notifications.user').equals(userId)
    .where('notifications.read').equals(false)
    .lean()

    const notifications = tasks.reduce((acc, task) => {
      return [...acc, ...task.notifications.filter(n => 
        n.user.toString() === userId.toString() && !n.read
      )]
    }, [])

    res.status(200).json(notifications)
  } catch (error) {
    next(error)
  }
}

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { taskId, notificationId } = req.params
    const userId = req.user._id

    validateObjectId(taskId, 'Task')
    validateObjectId(notificationId, 'Notification')

    const task = await Task.findById(taskId).exec()
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
  
    const task = await Task.findById(taskId).select('assignedTo').lean().exec()
    if (!task) throw new CustomError('Task not found', 404)

    // Allow current assignee or admin/root
    const ownerId = req.user._id;
    console.log('assignedTo:', task.assignedTo, 'ownerId:', ownerId);
    const isCurrentAssignee = task.assignedTo.some(u =>
      (u._id ? u._id.toString() : u.toString()) === ownerId.toString()
    );
    const isAdmin = req.roles && (req.roles.includes('Admin') || req.roles.includes('Root'));
    console.log('isCurrentAssignee:', isCurrentAssignee, 'isAdmin:', isAdmin);
    if (!isCurrentAssignee && !isAdmin) throw new CustomError('Only the current assignee or an admin can reassign this task', 401)

    // Allow all active users (including Admins) except those already assigned
    const unassignedUsers = await User.find({
      _id: { $nin: task.assignedTo },
      active: true
    }).select('name email roles').lean().exec()

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
    
    // Get all tasks and extract unique labels
    const tasks = await Task.find({}, 'labels').lean()
    const allLabels = tasks.reduce((acc, task) => {
      if (task.labels && Array.isArray(task.labels)) {
        acc.push(...task.labels)
      }
      return acc
    }, [])
    
    // Remove duplicates and sort
    const uniqueLabels = [...new Set(allLabels)].sort()
    console.log('Found unique labels:', uniqueLabels)
    
    const labelOptions = uniqueLabels.map(label => ({
      value: label,
      label: label
    }))
    
    console.log('Sending label options:', labelOptions)
    res.status(200).json(labelOptions)
  } catch (error) {
    console.error('Error fetching labels:', error)
    next(error)
  }
}
