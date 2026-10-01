const express = require('express');
const { chat, interviewPrep } = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect, authorize('student'));

router.post('/chat', chat);
router.post('/interview-prep', interviewPrep);

module.exports = router;
