// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../../config/mysqlConn');

// const TaskActivity = sequelize.define('TaskActivity', {
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
//     activity_type: {
//         type: DataTypes.ENUM('assigned', 'status', 'edit'),
//         allowNull: false
//     },
//     to_user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//         references: {
//             model: 'users',
//             key: 'id'
//         }
//     },
//     status: {
//         type: DataTypes.STRING,
//         allowNull: true
//     },
//     details: {
//         type: DataTypes.TEXT,
//         allowNull: true
//     }
// }, {
//     tableName: 'task_activities',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
// });

// module.exports = TaskActivity; 

// models/sequelize/TaskActivity.js
module.exports = (sequelize, DataTypes) => {
  const TaskActivity = sequelize.define('TaskActivity', {
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
    activity_type: {
      type: DataTypes.ENUM('assigned', 'status', 'edit'),
      allowNull: false
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'task_activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TaskActivity;
};
