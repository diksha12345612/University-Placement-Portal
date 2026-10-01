const express = require('express');
const { startInterview, answerQuestion, getMyInterviews, getInterview } = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect, authorize('student'));

router.post('/', startInterview);
router.get('/', getMyInterviews);
router.get('/:id', getInterview);
router.post('/:id/answer', answerQuestion);

module.exports = router;
