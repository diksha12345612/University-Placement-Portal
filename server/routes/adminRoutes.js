const express = require('express');
const {
  getUsers,
  getRecruiters,
  setRecruiterApproval,
  getJobs,
  reviewJob,
} = require('../controllers/adminController');
const { getStats } = require('../controllers/analyticsController');
const { getStudents, getStudentDetail, getStudentResume } = require('../controllers/adminStudentController');
const { getAllDrives, createDrive, updateDrive, deleteDrive } = require('../controllers/driveController');
const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const {
  getAllTests,
  getTestForAdmin,
  createTest,
  updateTest,
  setPublished,
  deleteTest,
} = require('../controllers/mockTestController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

// Every route in this file needs a logged-in admin
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);

router.get('/students', getStudents);
router.get('/students/:id', getStudentDetail);
router.get('/students/:id/resume', getStudentResume);

router.get('/recruiters', getRecruiters);
router.patch('/recruiters/:id/approval', setRecruiterApproval);

router.get('/jobs', getJobs);
router.patch('/jobs/:id/review', reviewJob);

router.get('/drives', getAllDrives);
router.post('/drives', createDrive);
router.put('/drives/:id', updateDrive);
router.delete('/drives/:id', deleteDrive);

router.get('/announcements', getAllAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

router.get('/mock-tests', getAllTests);
router.post('/mock-tests', createTest);
router.get('/mock-tests/:id', getTestForAdmin);
router.put('/mock-tests/:id', updateTest);
router.patch('/mock-tests/:id/publish', setPublished);
router.delete('/mock-tests/:id', deleteTest);

module.exports = router;
