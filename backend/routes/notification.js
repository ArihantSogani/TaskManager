const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const requireAuth = require('../middleware/requireAuth');

// POST /api/subscribe
router.post('/subscribe', notificationController.subscribe);

// POST /api/unsubscribe
router.post('/unsubscribe', notificationController.unsubscribe);

// GET /api/notifications
router.get('/', requireAuth, notificationController.getUserNotifications);

// POST /api/notification/read - mark notifications as read (all or by ID)
router.post('/read', requireAuth, notificationController.markAsRead);

module.exports = router; 