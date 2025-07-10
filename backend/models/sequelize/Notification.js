// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../../config/mysqlConn');

// const Notification = sequelize.define('Notification', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true
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
//     tableName: 'notifications',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
// });

// module.exports = Notification; 

// models/sequelize/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Notification;
};
