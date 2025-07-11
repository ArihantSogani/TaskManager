const router = require('express').Router()
const usersController = require('../controllers/user')
const requireAuth = require('../middleware/requireAuth')
const requireRoles = require('../middleware/requireRoles')
const ROLES_LIST = require('../config/rolesList')

// Minimal user list for activity timeline (id and name only), accessible to any authenticated user
router.get('/minimal', requireAuth, usersController.getMinimalList)

router.use(requireAuth)
router.use(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]))

router.route('/')
    .get(usersController.getAll)
    .post(usersController.create)
    .patch(usersController.update)

router.route('/:id')
    .delete(usersController.delete)

module.exports = router