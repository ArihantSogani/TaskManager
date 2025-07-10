// models/sequelize/index.js

const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysqlConn');

// Import models using factory pattern
const User = require('./User')(sequelize, DataTypes);
const Task = require('./Task')(sequelize, DataTypes);
const TaskAssignment = require('./TaskAssignment')(sequelize, DataTypes);
const TaskNotification = require('./TaskNotification')(sequelize, DataTypes);
const TaskComment = require('./TaskComment')(sequelize, DataTypes);
const TaskActivity = require('./TaskActivity')(sequelize, DataTypes);
const Label = require('./Label')(sequelize, DataTypes);
const Note = require('./Note')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const PushSubscription = require('./PushSubscription')(sequelize, DataTypes);

// Define associations
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
User.hasMany(Note, { foreignKey: 'user_id', as: 'notes' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(Label, { foreignKey: 'created_by', as: 'createdLabels' });
User.hasMany(TaskActivity, { foreignKey: 'user_id', as: 'taskActivities' });
User.hasMany(TaskActivity, { foreignKey: 'to_user_id', as: 'taskActivitiesTo' });
User.hasMany(TaskComment, { foreignKey: 'user_id', as: 'taskComments' });
User.hasMany(TaskNotification, { foreignKey: 'user_id', as: 'taskNotifications' });

Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.hasMany(TaskAssignment, { foreignKey: 'task_id', as: 'assignments' });
Task.hasMany(TaskNotification, { foreignKey: 'task_id', as: 'notifications' });
Task.hasMany(TaskComment, { foreignKey: 'task_id', as: 'comments' });
Task.hasMany(TaskActivity, { foreignKey: 'task_id', as: 'activities' });
Task.belongsToMany(Label, { through: 'TaskLabels', as: 'labels', foreignKey: 'task_id', otherKey: 'label_id' });
Label.belongsToMany(Task, { through: 'TaskLabels', as: 'tasks', foreignKey: 'label_id', otherKey: 'task_id' });

TaskAssignment.belongsTo(Task, { foreignKey: 'task_id' });
TaskAssignment.belongsTo(User, { foreignKey: 'user_id' });
// Task.belongsToMany(User, { through: TaskAssignment, foreignKey: 'task_id', otherKey: 'user_id', as: 'assignedUsers' });
// User.belongsToMany(Task, { through: TaskAssignment, foreignKey: 'user_id', otherKey: 'task_id', as: 'assignedTasks' });

TaskNotification.belongsTo(Task, { foreignKey: 'task_id' });
TaskNotification.belongsTo(User, { foreignKey: 'user_id' });

TaskComment.belongsTo(Task, { foreignKey: 'task_id' });
TaskComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TaskActivity.belongsTo(Task, { foreignKey: 'task_id' });
TaskActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
TaskActivity.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });

Label.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Note.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PushSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.associate({ Task, TaskAssignment });
Task.associate({ User, TaskAssignment });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Task,
  TaskAssignment,
  TaskNotification,
  TaskComment,
  TaskActivity,
  Label,
  Note,
  Notification,
  PushSubscription
};
