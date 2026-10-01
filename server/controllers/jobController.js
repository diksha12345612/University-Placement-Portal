const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const { JOB_TYPES } = require('../config/constants');
const { checkEligibility } = require('../utils/eligibility');
const { escapeRegex } = require('../utils/escapeRegex');

// The only jobs a student may ever see: approved by admin, still active, deadline not passed
const openJobsFilter = () => ({
  status: 'approved',
  isActive: true,
  deadline: { $gte: new Date() },
});


// Adds, for the logged-in student: { isEligible, reasons } and the status of their application (or null)
const withStudentInfo = (job, studentProfile, statusByJob) => ({
  ...job.toObject(),
  eligibilityCheck: checkEligibility(studentProfile, job),
  myApplicationStatus: statusByJob[String(job._id)] || null,
});

// { jobId: 'applied' | 'shortlisted' | ... } for this student's applications
const getStatusByJob = async (studentId, jobIds) => {
  const applications = await Application.find({ student: studentId, job: { $in: jobIds } }).select('job status');
  return Object.fromEntries(applications.map((a) => [String(a.job), a.status]));
};

// GET /api/jobs?search=react&type=Internship
// Private, student only. Lists open jobs, closest deadline first.
const listJobs = async (req, res) => {
  const { search, type } = req.query;
  const filter = openJobsFilter();

  if (search && String(search).trim()) {
    const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ title: pattern }, { company: pattern }, { location: pattern }];
  }

  if (type) {
    if (!JOB_TYPES.includes(type)) {
      throw new AppError(`Job type must be one of: ${JOB_TYPES.join(', ')}`, 400);
    }
    filter.type = type;
  }

  const jobs = await Job.find(filter).sort({ deadline: 1 });
  const statusByJob = await getStatusByJob(req.user._id, jobs.map((j) => j._id));

  res.status(200).json({
    success: true,
    count: jobs.length,
    jobs: jobs.map((job) => withStudentInfo(job, req.user.studentProfile, statusByJob)),
  });
};

// GET /api/jobs/:id
// Private, student only. A pending, rejected, closed or expired job gives 404.
const getJob = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, ...openJobsFilter() });
  if (!job) {
    throw new AppError('Job not found or no longer open', 404);
  }

  const statusByJob = await getStatusByJob(req.user._id, [job._id]);
  res.status(200).json({ success: true, job: withStudentInfo(job, req.user.studentProfile, statusByJob) });
};

module.exports = { listJobs, getJob };
