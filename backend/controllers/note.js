const { Note, User } = require('../models/sequelize');
const ROLES_LIST = require('../config/rolesList');
const { CustomError } = require('../middleware/errorHandler');
const { validateAuthInputField, validateObjectId } = require('../utils/validation');

exports.getAll = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const notes = await Note.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']]
    });
    if (!notes?.length) throw new CustomError('No notes record found', 404);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

exports.adminGetAll = async (req, res, next) => {
  try {
    const admin_id = req.user.id;
    const user_id = req.body.id;
    validateObjectId(user_id, 'Note');
    if(!user_id && (admin_id === user_id)) throw new CustomError('User id not found', 404);
    const notes = await Note.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']]
    });
    if (!notes?.length) throw new CustomError('No notes record found', 404);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    validateObjectId(id, 'Note');
    const note = await Note.findOne({ where: { user_id, id } });
    if (!note) throw new CustomError('No such note record found', 404);
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

exports.adminGetById = async (req, res, next) => {
  try {
    const note_id = req.body.id;
    validateObjectId(note_id, 'Note');
    const note = await Note.findByPk(note_id);
    if (!note) throw new CustomError('No such note record found', 404);
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, text, tag } = req.body;
    validateAuthInputField({ title, text });
    const userId = req.user.id;
    const targetUserId = req.body.id;
    let idToCreate = userId;
    if(targetUserId && (userId !== targetUserId) && (req.roles.includes(ROLES_LIST.Admin))){
      idToCreate = targetUserId;
    }
    const note = await Note.create({ title, text, user_id: idToCreate, tag });
    if(!note) throw new CustomError('Something went wrong, during creating new note', 400);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, text } = req.body;
    validateAuthInputField({ title, text });
    validateObjectId(id, 'Note');
    const userId = req.user.id;
    const targetUserId = req.body.id;
    let idToUpdate = userId;
    if(targetUserId && (userId !== targetUserId) && (req.roles.includes(ROLES_LIST.Admin))){
      idToUpdate = targetUserId;
    }
    const note = await Note.findByPk(id);
    if (!note) throw new CustomError('No such note record found', 404);
    await note.update({ ...req.body });
    //after update return new record
    const updatedRecord = await Note.findAll({ where: { user_id: idToUpdate }, order: [['created_at', 'DESC']] });
    res.status(200).json(updatedRecord);
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'Note');
    const note = await Note.findByPk(id);
    if(!note) throw new CustomError('No such note record found', 404);
    await note.destroy();
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};