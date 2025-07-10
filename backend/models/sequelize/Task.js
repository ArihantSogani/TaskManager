// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../../config/mysqlConn');

// const Task = sequelize.define('Task', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true
//     },
//     title: {
//         type: DataTypes.STRING,
//         allowNull: false
//     },
//     description: {
//         type: DataTypes.TEXT,
//         allowNull: false
//     },
//     status: {
//         type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'On Hold'),
//         defaultValue: 'Pending',
//         allowNull: false
//     },
//     priority: {
//         type: DataTypes.ENUM('Low', 'Medium', 'High'),
//         defaultValue: 'Medium',
//         allowNull: false
//     },
//     due_date: {
//         type: DataTypes.DATE
//     },
//     completed_at: {
//         type: DataTypes.DATE
//     },
//        labelData: {
//      type: DataTypes.JSON,
//      defaultValue: []
//     },
//     activity: {
//         type: DataTypes.JSON,
//         defaultValue: []
//     },
//     attachments: {
//         type: DataTypes.JSON,
//         defaultValue: []
//     },
//     created_by: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: 'users',
//             key: 'id'
//         }
//     }
// }, {
//     tableName: 'tasks',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
// });

// module.exports = Task; 

// models/sequelize/Task.js
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'On Hold'),
      defaultValue: 'Pending',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      defaultValue: 'Medium',
      allowNull: false
    },
    due_date: {
      type: DataTypes.DATE
    },
    completed_at: {
      type: DataTypes.DATE
    },
    labelData: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    activity: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Task.associate = ({ User, TaskAssignment }) => {
    Task.belongsToMany(User, {
      through: TaskAssignment,
      as: 'assignedUsers',
      foreignKey: 'task_id',
      otherKey: 'user_id'
    });
  };

  return Task;
};
