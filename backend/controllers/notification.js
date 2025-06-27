const PushSubscription = require('../models/PushSubscription');
const { sendNotification } = require('../utils/webPush');

// Save a user's push subscription
exports.subscribe = async (req, res) => {
  console.log('Received subscribe request:', JSON.stringify(req.body, null, 2)); // Debug log
  try {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) return res.status(400).json({ message: 'Missing userId or subscription' });

    // Upsert subscription for user
    await PushSubscription.findOneAndUpdate(
      { user: userId, endpoint: subscription.endpoint },
      { user: userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    );
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
    await PushSubscription.findOneAndDelete({ user: userId, endpoint });
    console.log(`User ${userId} DISABLED push notifications.`);
    res.status(200).json({ message: 'Subscription removed' });
  } catch (err) {
    console.error('Failed to remove subscription:', err);
    res.status(500).json({ message: 'Failed to remove subscription', error: err.message });
  }
};

// Send notification to a user
exports.sendToUser = async (userId, payload) => {
  const subs = await PushSubscription.find({ user: userId });
  for (const sub of subs) {
    try {
      await sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
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