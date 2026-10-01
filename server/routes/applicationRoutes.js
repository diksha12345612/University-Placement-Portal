const express = require('express');
const { getMyApplications, withdrawApplication } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/me', getMyApplications);
router.delete('/:id', withdrawApplication);

module.exports = router;
