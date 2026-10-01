const express = require('express');
const {
  getPublishedTests,
  startTest,
  submitAttempt,
  getMyAttempts,
  getAttemptResult,
} = require('../controllers/mockTestController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Student side of mock tests. The admin side is in adminRoutes.
const router = express.Router();

router.use(protect, authorize('student'));

router.get('/', getPublishedTests);
router.get('/attempts/me', getMyAttempts); // must be before "/attempts/:attemptId"
router.get('/attempts/:attemptId', getAttemptResult);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.post('/:id/start', startTest);

module.exports = router;
