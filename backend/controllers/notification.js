const { PushSubscription, Notification } = require('../models/sequelize');
const { sendNotification } = require('../utils/webPush');

// Save a user's push subscription
exports.subscribe = async (req, res) => {
  console.log('Received subscribe request:', JSON.stringify(req.body, null, 2)); // Debug log
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) return res.status(400).json({ message: 'Missing userId or subscription' });
    // Upsert subscription for user
    await PushSubscription.upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    });
    console.log(`User ${userId} ENABLED push notifications.`);
    res.status(201).json({ message: 'Subscription saved' });
  } catch (err) {
    console.error('Failed to save subscription:', err);
    res.status(500).json({ message: 'Failed to save subscription', error: err.message });
  }
};

// Unsubscribe endpoint
exports.unsubscribe = async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    if (!userId || !endpoint) return res.status(400).json({ message: 'Missing userId or endpoint' });
    await PushSubscription.destroy({ where: { user_id: userId, endpoint } });
    console.log(`User ${userId} DISABLED push notifications.`);
    res.status(200).json({ message: 'Subscription removed' });
  } catch (err) {
    console.error('Failed to remove subscription:', err);
    res.status(500).json({ message: 'Failed to remove subscription', error: err.message });
  }
};

// Send notification to a user
exports.sendToUser = async (userId, payload) => {
  const subs = await PushSubscription.findAll({ where: { user_id: userId } });
  for (const sub of subs) {
    try {
      await sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (err) {
      // Optionally handle expired subscriptions
    }
  }
};

// Send notification to multiple users
exports.sendToUsers = async (userIds, payload) => {
  for (const userId of userIds) {
    await exports.sendToUser(userId, payload);
  }
};

// Fetch all notifications for the logged-in user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    const unreadCount = await Notification.count({ where: { user_id: userId, read: false } });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

// Mark notifications as read (all or by ID)
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;
    if (notificationId) {
      // Mark a specific notification as read
      await Notification.update({ read: true }, { where: { id: notificationId, user_id: userId } });
    } else {
      // Mark all notifications as read
      await Notification.update({ read: true }, { where: { user_id: userId, read: false } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications as read', error: err.message });
  }
}; 