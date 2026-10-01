const Notification = require('../models/Notification');

// Creates an in-app notification. If it fails we only log it, because the main action
// (for example changing an application status) has already succeeded and should not fail.
const createNotification = async ({ user, title, message, type = 'system', link }) => {
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (error) {
    console.error(`Could not create notification: ${error.message}`);
  }
};

// Same message to many users (e.g. every student) in one database call
const notifyMany = async (userIds, { title, message, type = 'system', link }) => {
  if (userIds.length === 0) return;
  try {
    await Notification.insertMany(userIds.map((user) => ({ user, title, message, type, link })));
  } catch (error) {
    console.error(`Could not create notifications: ${error.message}`);
  }
};

module.exports = { createNotification, notifyMany };
