const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

// GET /api/notifications
// Private, any logged-in user. Latest 30 notifications and the unread count.
const getNotifications = async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.status(200).json({ success: true, unreadCount, notifications });
};

// PATCH /api/notifications/:id/read
// The user filter makes sure nobody can mark someone else's notification.
const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { returnDocument: 'after' }
  );
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(200).json({ success: true, notification });
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
