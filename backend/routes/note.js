const router = require('express').Router()
const notesController = require('../controllers/note')
const requireRoles = require('../middleware/requireRoles')
const ROLES_LIST = require('../config/rolesList')

router.use(requireRoles([...Object.values(ROLES_LIST)]))

router.route('/')
    .get(notesController.getAll)
    .post(notesController.create)

router.route('/:id')
    .get(notesController.getById)
    .patch(notesController.update)
    .delete(notesController.delete)

router.route('/admin-all')
    .post(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]), notesController.adminGetAll)
router.route('/admin-byid')
    .post(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]), notesController.adminGetById)

module.exports = router