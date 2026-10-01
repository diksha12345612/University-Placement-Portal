const express = require('express');
const {
  createJob,
  getMyJobs,
  getMyJob,
  updateJob,
  setJobActive,
  getJobApplications,
  updateApplication,
  getApplicantResume,
  aiEvaluateApplication,
} = require('../controllers/recruiterController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

// Every route in this file needs a logged-in, approved recruiter (protect checks approval)
router.use(protect, authorize('recruiter'));

router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.get('/jobs/:id', getMyJob);
router.put('/jobs/:id', updateJob);
router.patch('/jobs/:id/active', setJobActive);
router.get('/jobs/:id/applications', getJobApplications);

router.patch('/applications/:id', updateApplication);
router.get('/applications/:id/resume', getApplicantResume);
router.post('/applications/:id/ai-evaluate', aiEvaluateApplication);

module.exports = router;
