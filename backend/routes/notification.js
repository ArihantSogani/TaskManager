const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');

// POST /api/subscribe
router.post('/subscribe', notificationController.subscribe);

// POST /api/unsubscribe
router.post('/unsubscribe', notificationController.unsubscribe);

module.exports = router; 