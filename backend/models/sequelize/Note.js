// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../../config/mysqlConn');

// const Note = sequelize.define('Note', {
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
//     title: {
//         type: DataTypes.STRING,
//         allowNull: false
//     },
//     text: {
//         type: DataTypes.TEXT,
//         allowNull: false
//     },
//     tag: {
//         type: DataTypes.JSON,
//         defaultValue: []
//     }
// }, {
//     tableName: 'notes',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
// });

// module.exports = Note; 

// models/sequelize/Note.js
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tag: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'notes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Note;
};
