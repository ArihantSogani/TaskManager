const router = require('express').Router()
const tasksController = require('../controllers/task')
const requireRoles = require('../middleware/requireRoles')
const ROLES_LIST = require('../config/rolesList')
const multer = require('multer')
const path = require('path')

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/jpg',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Invalid file type'))
  }
})

// Routes accessible by all authenticated users
router.route('/')
  .get(requireRoles([...Object.values(ROLES_LIST)]), tasksController.getAll)

// Get notifications for the authenticated user
router.route('/notifications')
  .get(requireRoles([...Object.values(ROLES_LIST)]), tasksController.getNotifications)

// Mark notification as read
router.route('/notifications/:taskId/:notificationId')
  .patch(requireRoles([...Object.values(ROLES_LIST)]), tasksController.markNotificationRead)

// Add comment to task
router.route('/:id/comments')
  .post(requireRoles([...Object.values(ROLES_LIST)]), tasksController.addComment)

// PATCH route for all authenticated users (for status update)
router.route('/:id')
  .patch(requireRoles([...Object.values(ROLES_LIST)]), tasksController.update)

// Admin and Root only routes
router.use(requireRoles([ROLES_LIST.Root, ROLES_LIST.Admin]))

router.route('/')
  .post(upload.array('files'), tasksController.create)

router.route('/:id')
  .get(tasksController.getById)
  .delete(tasksController.delete)

router.route('/assign')
  .post(tasksController.assignUser)

router.route('/assign/:id')
  .get(tasksController.getAssignUser)
  .delete(tasksController.deleteAssign)

router.route('/unassigned/:taskId')
  .get(tasksController.getUnassignedUsers)

router.route('/inspect')
  .post(tasksController.inspect)

module.exports = router