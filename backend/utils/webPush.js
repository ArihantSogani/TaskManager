const webpush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// webpush.setVapidDetails(
//   'mailto:admin@example.com',
//   VAPID_PUBLIC_KEY,
//   VAPID_PRIVATE_KEY
// );

module.exports = {
  sendNotification: (subscription, payload) => {
    return webpush.sendNotification(subscription, JSON.stringify(payload));
  },
  VAPID_PUBLIC_KEY
}; 