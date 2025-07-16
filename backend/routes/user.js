const router = require('express').Router()
const usersController = require('../controllers/user')
const requireAuth = require('../middleware/requireAuth')
const requireRoles = require('../middleware/requireRoles')
const ROLES_LIST = require('../config/rolesList')

// Minimal user list for activity timeline (id and name only), accessible to any authenticated user
router.get('/minimal', requireAuth, usersController.getMinimalList)

router.use(requireAuth)

// Only protect GET, POST, DELETE with requireRoles
router.route('/')
    .get(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]), usersController.getAll)
    .post(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]), usersController.create)
    .patch(usersController.update)

router.route('/:id')
    .delete(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]), usersController.delete)

module.exports = router