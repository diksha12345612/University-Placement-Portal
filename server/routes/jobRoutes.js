const express = require('express');
const { listJobs, getJob } = require('../controllers/jobController');
const { applyToJob } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

// Students browse open jobs here. Recruiters and admins have their own job routes.
router.use(protect, authorize('student'));

router.get('/', listJobs);
router.get('/:id', getJob);
router.post('/:id/apply', applyToJob);

module.exports = router;
