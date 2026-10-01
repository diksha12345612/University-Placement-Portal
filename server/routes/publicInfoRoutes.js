const express = require('express');
const { getActiveDrives } = require('../controllers/driveController');
const { getMyAnnouncements } = require('../controllers/announcementController');
const { getPublicStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Read-only info that every logged-in user can see. Creating and editing is in adminRoutes.
// protect is added per route (not router.use), because this router is mounted on "/api"
// and router.use would also run for unknown URLs, turning a 404 into a 401.
const router = express.Router();

router.get('/drives', protect, getActiveDrives);
router.get('/announcements', protect, getMyAnnouncements);
router.get('/public/stats', getPublicStats); // no login: totals for the landing page

module.exports = router;
