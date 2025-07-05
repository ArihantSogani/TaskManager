const express = require('express')
const router = express.Router()
const labelController = require('../controllers/label')
const { requireAuth } = require('../middleware/requireAuth')

// Get all labels (available to all authenticated users)
router.get('/', requireAuth, labelController.getAllLabels)

module.exports = router 