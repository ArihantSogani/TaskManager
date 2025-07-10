// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../../config/mysqlConn');
// const bcrypt = require('bcrypt');
// const { CustomError } = require('../../middleware/errorHandler');
// const { validateAuthInputField } = require('../../utils/validation');

// const User = sequelize.define('User', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true
//     },
//     name: {
//         type: DataTypes.STRING,
//         allowNull: false
//     },
//     email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//         validate: {
//             isEmail: true
//         }
//     },
//     roles: {
//         type: DataTypes.JSON,
//         defaultValue: ["User"]
//     },
//     password_hashed: {
//         type: DataTypes.STRING,
//         allowNull: false
//     },
//     password_error_count: {
//         type: DataTypes.INTEGER,
//         defaultValue: 0
//     },
//     password_error_date: {
//         type: DataTypes.DATE
//     },
//     active: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: true
//     },
//     is_online: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false
//     },
//     last_active: {
//         type: DataTypes.DATE,
//         defaultValue: DataTypes.NOW
//     }
// }, {
//     tableName: 'users',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at'
// });

// // Static methods
// User.signup = async function(name, email, password) {
//     validateAuthInputField({ name, email, password });

//     const duplicateEmail = await this.findOne({ 
//         where: { email: email.trim() } 
//     });
    
//     if (duplicateEmail) throw new CustomError('Email already in use', 409);

//     const hashedPassword = await bcrypt.hash(password, 10);
    
//     const newUser = { 
//         name: name.trim(), 
//         email: email.trim(), 
//         password_hashed: hashedPassword 
//     };

//     const user = await this.create(newUser);
//     if (!user) throw new CustomError('Invalid user data received', 400);

//     return user;
// };

// User.login = async function(email, password) {
//     validateAuthInputField({ email, password });

//     const user = await this.findOne({ 
//         where: { email: email.trim() } 
//     });
    
//     if (!user) throw new CustomError('Incorrect Email', 400);
    
//     if (!user.active) throw new CustomError('Your account has been temporarily blocked. Please reach out to our Technical Support team for further assistance.', 403);
    
//     const match = await bcrypt.compare(password, user.password_hashed);
    
//     if (!match) {
//         const now = new Date();
//         const day = 24 * 60 * 60 * 1000;

//         if (user.password_error_count >= 3 && user.password_error_date && (now - user.password_error_date) < day) {
//             await this.update({ active: false }, { where: { email } });
//             throw new CustomError("You've tried to login too many times with an incorrect account password, this account has been temporarily blocked for security reasons. Please reach out to our Technical Support team for further assistance.", 429);
//         }

//         if ((now - user.password_error_date) >= day) {
//             await this.update({ password_error_count: 0 }, { where: { email } });
//         }
        
//         if (!user.active) throw new CustomError('Your account has been temporarily blocked. Please reach out to our Technical Support team for further assistance.', 403);
        
//         user.password_error_count += 1;
//         user.password_error_date = new Date();
//         await user.save();

//         throw new CustomError('Incorrect Password', 400);
//     }

//     return user;
// };

// module.exports = User; 

// models/sequelize/User.js
const bcrypt = require('bcrypt');
const { CustomError } = require('../../middleware/errorHandler');
const { validateAuthInputField } = require('../../utils/validation');
const { isObjectIdOrHexString } = require('mongoose');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    roles: {
      type: DataTypes.JSON,
      defaultValue: ['User']
    },
    password_hashed: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password_error_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    password_error_date: {
      type: DataTypes.DATE
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_active: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = ({ Task, TaskAssignment }) => {
    User.belongsToMany(Task, {
      through: TaskAssignment,
      as: 'assignedTasks',
      foreignKey: 'user_id',
      otherKey: 'task_id'
    });
  };

  // Static signup method
  User.signup = async function(name, email, password) {
    validateAuthInputField({ name, email, password });

    const duplicateEmail = await this.findOne({ where: { email: email.trim() } });
    if (duplicateEmail) throw new CustomError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.create({
      name: name.trim(),
      email: email.trim(),
      password_hashed: hashedPassword
    });

    if (!user) throw new CustomError('Invalid user data received', 400);
    return user;
  };

  // Static login method
  User.login = async function(email, password) {
    validateAuthInputField({ email, password });

    const user = await this.findOne({ where: { email: email.trim() } });
    if (!user) throw new CustomError('Incorrect Email', 400);
    if (!user.active) throw new CustomError('Your account has been blocked.', 403);

    const match = await bcrypt.compare(password, user.password_hashed);
    if (!match) {
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;

      if (user.password_error_count >= 3 && user.password_error_date && (now - user.password_error_date) < oneDay) {
        await this.update({ active: false }, { where: { email } });
        throw new CustomError('Too many failed attempts. Account blocked.', 429);
      }

      if (!user.password_error_date || (now - user.password_error_date) >= oneDay) {
        user.password_error_count = 0;
      }

      user.password_error_count += 1;
      user.password_error_date = now;
      await user.save();

      throw new CustomError('Incorrect Password', 400);
    }

    return user;
  };

  return User;
};
