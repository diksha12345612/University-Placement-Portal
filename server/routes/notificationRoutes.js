const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Any logged-in user (student, recruiter or admin) has notifications
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead); // must be before "/:id/read"
router.patch('/:id/read', markAsRead);

module.exports = router;
