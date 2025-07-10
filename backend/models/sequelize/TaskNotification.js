// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../../config/mysqlConn');

// const TaskNotification = sequelize.define('TaskNotification', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true
//     },
//     task_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: 'tasks',
//             key: 'id'
//         }
//     },
//     user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: 'users',
//             key: 'id'
//         }
//     },
//     message: {
//         type: DataTypes.TEXT,
//         allowNull: false
//     },
//     read: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false
//     }
// }, {
//     tableName: 'task_notifications',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
// });

// module.exports = TaskNotification; 

// models/sequelize/TaskNotification.js
module.exports = (sequelize, DataTypes) => {
  const TaskNotification = sequelize.define('TaskNotification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'task_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TaskNotification;
};
