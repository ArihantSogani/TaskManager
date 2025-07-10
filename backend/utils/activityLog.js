// Utility functions for activity log handling

/**
 * Creates a standardized activity log entry.
 * @param {Object} params - Parameters for the activity entry.
 * @param {string} params.type - Activity type (e.g., 'assigned', 'status', 'edit', etc.)
 * @param {number} params.user - Acting user ID.
 * @param {number} [params.to] - Target user ID (if applicable).
 * @param {string} [params.field] - Field changed (for edit activities).
 * @param {any} [params.oldValue] - Old value (for edit/status activities).
 * @param {any} [params.newValue] - New value (for edit activities).
 * @param {string} [params.status] - New status (for status activities).
 * @param {string} [params.details] - Details string.
 * @returns {Object} Standardized activity log entry.
 */
function createActivityEntry({ type, user, to, field, oldValue, newValue, status, details }) {
  const entry = {
    type,
    user,
    timestamp: new Date(),
  };
  if (to !== undefined) entry.to = to;
  if (field !== undefined) entry.field = field;
  if (oldValue !== undefined) entry.oldValue = oldValue;
  if (newValue !== undefined) entry.newValue = newValue;
  if (status !== undefined) entry.status = status;
  if (details !== undefined) entry.details = details;
  return entry;
}

/**
 * Extracts all user IDs referenced in an activity log array (from 'user' and 'to' fields).
 * @param {Array} activityArr - Array of activity log entries.
 * @returns {Set<number>} Set of user IDs.
 */
function extractUserIdsFromActivity(activityArr) {
  const userIds = new Set();
  if (Array.isArray(activityArr)) {
    activityArr.forEach(act => {
      if (act.user) userIds.add(Number(act.user));
      if (act.to) userIds.add(Number(act.to));
    });
  }
  return userIds;
}

module.exports = {
  createActivityEntry,
  extractUserIdsFromActivity,
}; 