const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadResume,
  getMyResumeUrl,
  deleteResume,
  analyzeResume,
  uploadPhoto,
  deletePhoto,
  importLinkedIn,
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { uploadResume: resumeUpload, uploadPhoto: photoUpload, uploadLinkedInPdf } = require('../middleware/upload');

const router = express.Router();

// Every route in this file needs a logged-in student
router.use(protect, authorize('student'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.post('/resume', resumeUpload, uploadResume);
router.get('/resume', getMyResumeUrl);
router.delete('/resume', deleteResume);
router.post('/resume/analyze', analyzeResume);

router.post('/photo', photoUpload, uploadPhoto);
router.delete('/photo', deletePhoto);

router.post('/linkedin-import', uploadLinkedInPdf, importLinkedIn);

module.exports = router;
