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
        // Only allow users to update their own profile/password, but only admins/root can update others or change roles/active
        const isSelf = req.user.id.toString() === id.toString();
        const isAdmin = req.roles.includes(ROLES_LIST.Admin);
        const isRoot = req.roles.includes(ROLES_LIST.Root);
        // Prevent non-admin/root from editing other users
        if (!isSelf && !isAdmin && !isRoot) {
            throw new CustomError('Not authorized to edit other users', 401);
        }
        // Prevent non-admin/root from changing roles or active
        if ((roles || typeof active === 'boolean') && !isAdmin && !isRoot) {
            throw new CustomError('Not authorized to change roles or active status', 401);
        }
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
            // Require currentPassword for password change
            if (!req.body.currentPassword) {
                throw new CustomError('Current password is required to change password', 400);
            }
            // Check current password
            const isMatch = await bcrypt.compare(req.body.currentPassword, checkUser.password_hashed);
            if (!isMatch) {
                throw new CustomError('Current password does not match', 400);
            }
            validateAuthInputField({ password });
            updateFields.password_hashed = await bcrypt.hash(password, 10);
            updateFields.password_error_count = 0;
        }
        if(roles && (isAdmin || isRoot)){
            if (!Array.isArray(roles) || !roles.length) throw new CustomError('Invalid roles data type received', 400);
            updateFields.roles = roles;
        }
        if (typeof active === 'boolean' && (isAdmin || isRoot)) {
            updateFields.active = active;
            if (active) {
                updateFields.password_error_count = 0;
            } else {
                updateFields.is_online = false;
            }
        }
        const verifyRole = await User.findByPk(id);
        if(verifyRole.roles.includes(ROLES_LIST.Root)) throw new CustomError('Not authorized to edit root user', 401);
        if(
          isAdmin &&
          verifyRole.roles.includes(ROLES_LIST.Admin) &&
          req.user.id.toString() !== id.toString() // allow self-edit
        ) throw new CustomError('Not authorized to edit this admin', 401);
        await User.update(updateFields, { where: { id } });
        // Only return the updated user for self-update, else return all users for admin/root
        if (isSelf && !isAdmin && !isRoot) {
            const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password_hashed', 'password_error_count', 'password_error_date'] } });
            return res.status(200).json([updatedUser]);
        }
        const query = isRoot ? {} : { [Op.or]: [{ roles: ROLES_LIST.User }, { id: req.user.id }], roles: { [Op.not]: ROLES_LIST.Root } };
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

exports.getMinimalList = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name']
        });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};