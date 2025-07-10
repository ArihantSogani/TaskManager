const bcrypt = require('bcrypt');
const { User } = require('../models/sequelize');
const ROLES_LIST = require('../config/rolesList');
const { CustomError } = require('../middleware/errorHandler');
const { validateAuthInputField, validateObjectId } = require('../utils/validation');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
    try {
        // Allow Admins to see all users except Root
        const query = req.roles.includes(ROLES_LIST.Root)
          ? {}
          : { roles: { [Op.not]: ROLES_LIST.Root } };
        const users = await User.findAll({
            where: query,
            order: [['is_online', 'DESC'], ['last_active', 'DESC']],
            attributes: { exclude: ['password_hashed', 'password_error_count', 'password_error_date'] }
        });
        if (!users?.length) throw new CustomError('No users found', 404);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name, email, password, roles, active } = req.body;
        validateAuthInputField({ name, email, password });
        if(roles){if (!Array.isArray(roles) || !roles.length) throw new CustomError('Invalid roles data type received', 400);}
        if(active){if(typeof active !== 'boolean') throw new CustomError('Invalid active data type received', 400);}
        const duplicateEmail = await User.findOne({ where: { email } });
        if(duplicateEmail) throw new CustomError('Email already in use', 409);
        const hashedPassword  = await bcrypt.hash(password, 10);
        // Remove the restriction that blocks admins from creating admins
        // if(roles.includes(ROLES_LIST.Admin) && req.roles.includes(ROLES_LIST.Admin)) throw new CustomError('Not authorized to create admin', 401);
        const createUser = { name: name.trim(), email: email.trim(), password_hashed: hashedPassword, roles: roles ?? [ROLES_LIST.User], active: active ?? true };
        const user = await User.create(createUser);
        if(!user) throw new CustomError('Invalid user data received', 400);
        res.status(201).json({ id: user.id, name: user.name, email: user.email, roles: user.roles, active: user.active, is_online: user.is_online, last_active: user.last_active });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { id, name, email, password, roles, active } = req.body;
        validateObjectId(id, 'User');
        const checkUser = await User.findByPk(id);
        if (!checkUser) throw new CustomError('User not found', 400);
        const updateFields = {};
        if(name) { 
            validateAuthInputField({ name });
            updateFields.name = name; 
        }
        if(email){
            validateAuthInputField({ email });
            const duplicateEmail = await User.findOne({ where: { email } });
            if (duplicateEmail && duplicateEmail.id.toString() !== id) throw new CustomError('Email already in use', 409);
            updateFields.email = email;
        }
        if(password){
            validateAuthInputField({ password });
            updateFields.password_hashed = await bcrypt.hash(password, 10);
            updateFields.password_error_count = 0;
        }
        if(roles){
            if (!Array.isArray(roles) || !roles.length) throw new CustomError('Invalid roles data type received', 400);
            updateFields.roles = roles;
        }
        if (typeof active === 'boolean') {
            updateFields.active = active;
            if (active) {
                updateFields.password_error_count = 0;
            } else {
                updateFields.is_online = false;
            }
        }
        const verifyRole = await User.findByPk(id);
        if(verifyRole.roles.includes(ROLES_LIST.Root)) throw new CustomError('Not authorized to edit root user', 401);
        if(req.roles.includes(ROLES_LIST.Admin) && verifyRole.roles.includes(ROLES_LIST.Admin)) throw new CustomError('Not authorized to edit this admin', 401);
        await User.update(updateFields, { where: { id } });
        const query = req.roles.includes(ROLES_LIST.Root) ? {} : { [Op.or]: [{ roles: ROLES_LIST.User }, { id: req.user.id }], roles: { [Op.not]: ROLES_LIST.Root } };
        const users = await User.findAll({
            where: query,
            order: [['is_online', 'DESC'], ['last_active', 'DESC']],
            attributes: { exclude: ['password_hashed', 'password_error_count', 'password_error_date'] }
        });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateObjectId(id, 'User');
        const verifyRole = await User.findByPk(id);
        if(verifyRole.roles.includes(ROLES_LIST.Root)) throw new CustomError('Not authorized to delete root user', 401);
        if(req.roles.includes(ROLES_LIST.Admin) && verifyRole.roles.includes(ROLES_LIST.Admin)) throw new CustomError('Not authorized to delete this admin', 401);
        const user = await User.findByPk(id);
        if (!user) throw new CustomError('User not found', 404);
        await user.destroy();
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};