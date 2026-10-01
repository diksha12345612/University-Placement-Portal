const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const { validateJob } = require('../utils/validateJob');
const { APPLICATION_STATUSES, RECRUITER_SETTABLE_STATUSES } = require('../config/constants');
const { createNotification } = require('../services/notificationService');
const { updatePlacementStatus } = require('../services/placementService');
const { getResumeSignedUrl, SIGNED_URL_MINUTES } = require('../services/storageService');
const { evaluateApplication } = require('../services/aiService');

// Finds a job only if it belongs to the logged-in recruiter.
// Another recruiter's job id gives "not found", so nobody can edit someone else's job.
const findOwnJob = async (jobId, recruiterId) => {
  const job = await Job.findOne({ _id: jobId, postedBy: recruiterId });
  if (!job) throw new AppError('Job not found', 404);
  return job;
};

// Same idea for applications: the application's job must be posted by this recruiter
const findOwnApplication = async (applicationId, recruiterId) => {
  const application = await Application.findById(applicationId).populate('job');
  if (!application || !application.job || String(application.job.postedBy) !== String(recruiterId)) {
    throw new AppError('Application not found', 404);
  }
  return application;
};

// POST /api/recruiter/jobs
// Private, recruiter only. The job starts as "pending" until the admin approves it.
const createJob = async (req, res) => {
  const data = validateJob(req.body);

  const job = await Job.create({
    ...data,
    company: req.user.recruiterProfile.companyName,
    postedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Job submitted. Students will see it after the placement office approves it.',
    job,
  });
};

// GET /api/recruiter/jobs
// Private, recruiter only. All jobs posted by this recruiter, newest first, with applicant counts.
const getMyJobs = async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });

  // Count applications for all these jobs in one database query
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobs.map((j) => j._id) } } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
  ]);
  const countByJob = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.status(200).json({
    success: true,
    count: jobs.length,
    jobs: jobs.map((job) => ({ ...job.toObject(), applicantCount: countByJob[String(job._id)] || 0 })),
  });
};

// GET /api/recruiter/jobs/:id
const getMyJob = async (req, res) => {
  const job = await findOwnJob(req.params.id, req.user._id);
  res.status(200).json({ success: true, job });
};

// PUT /api/recruiter/jobs/:id
// Editing sends the job back to "pending", so the admin re-checks the changed details.
const updateJob = async (req, res) => {
  const job = await findOwnJob(req.params.id, req.user._id);
  const data = validateJob(req.body);

  Object.assign(job, data);
  job.status = 'pending';
  job.rejectionReason = undefined;
  job.reviewedAt = undefined;
  await job.save();

  res.status(200).json({
    success: true,
    message: 'Job updated and sent to the placement office for approval again',
    job,
  });
};

// PATCH /api/recruiter/jobs/:id/active
// Body: { isActive: true | false }. Closes the job early, or opens it again.
const setJobActive = async (req, res) => {
  const { isActive } = req.body || {};
  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be true or false', 400);
  }

  const job = await findOwnJob(req.params.id, req.user._id);
  job.isActive = isActive;
  await job.save();

  res.status(200).json({
    success: true,
    message: isActive ? 'Job is open for applications again' : 'Job closed. Students can no longer apply.',
    job,
  });
};

// GET /api/recruiter/jobs/:id/applications?status=shortlisted
// Applicants for one of this recruiter's jobs, oldest first, plus a count for each status.
const getJobApplications = async (req, res) => {
  const job = await findOwnJob(req.params.id, req.user._id);
  const { status } = req.query;

  const filter = { job: job._id };
  if (status) {
    if (!APPLICATION_STATUSES.includes(status)) {
      throw new AppError(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`, 400);
    }
    filter.status = status;
  }

  const [applications, counts] = await Promise.all([
    Application.find(filter).populate('student', 'name email studentProfile').sort({ createdAt: 1 }),
    Application.aggregate([{ $match: { job: job._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  counts.forEach((c) => (statusCounts[c._id] = c.count));

  res.status(200).json({ success: true, job, statusCounts, count: applications.length, applications });
};

// Message the student sees for each new status
const STATUS_MESSAGES = {
  shortlisted: (job) => `You have been shortlisted for ${job.title} at ${job.company}.`,
  interview: (job) => `You have moved to the interview round for ${job.title} at ${job.company}.`,
  selected: (job) => `Congratulations! You have been selected for ${job.title} at ${job.company}.`,
  rejected: (job) => `Your application for ${job.title} at ${job.company} was not selected this time.`,
};

// PATCH /api/recruiter/applications/:id
// Body: { status?: 'shortlisted' | 'interview' | 'selected' | 'rejected', notes?: string }
const updateApplication = async (req, res) => {
  const { status, notes } = req.body || {};

  if (status === undefined && notes === undefined) {
    throw new AppError('Send a new status or notes to update', 400);
  }
  if (status !== undefined && !RECRUITER_SETTABLE_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${RECRUITER_SETTABLE_STATUSES.join(', ')}`, 400);
  }
  if (notes !== undefined && String(notes).length > 1000) {
    throw new AppError('Notes cannot be longer than 1000 characters', 400);
  }

  const application = await findOwnApplication(req.params.id, req.user._id);

  const statusChanged = status !== undefined && status !== application.status;
  if (statusChanged) {
    application.status = status;
    application.statusHistory.push({ status, changedAt: new Date() });
  }
  if (notes !== undefined) {
    application.notes = String(notes).trim();
  }
  await application.save();

  if (statusChanged) {
    await updatePlacementStatus(application.student);
    await createNotification({
      user: application.student,
      title: `Application ${status}`,
      message: STATUS_MESSAGES[status](application.job),
      type: 'application',
      link: '/student/applications',
    });
  }

  let message = 'Notes saved';
  if (statusChanged) message = `Status changed to ${status}. The student has been notified.`;
  else if (notes === undefined) message = `Status is already ${status}`;

  res.status(200).json({ success: true, message, application });
};

// GET /api/recruiter/applications/:id/resume
// A short-lived link to the applicant's current resume. Only for the recruiter who owns the job.
const getApplicantResume = async (req, res) => {
  const application = await findOwnApplication(req.params.id, req.user._id);
  const student = await User.findById(application.student);
  const publicId = student?.studentProfile?.resumePublicId;

  if (!publicId) {
    throw new AppError('This student has removed their resume', 404);
  }

  res.status(200).json({ success: true, url: getResumeSignedUrl(publicId), expiresInMinutes: SIGNED_URL_MINUTES });
};

// POST /api/recruiter/applications/:id/ai-evaluate
// Asks the AI how well this applicant fits the job. It is advice only; the recruiter still decides.
const aiEvaluateApplication = async (req, res) => {
  const application = await findOwnApplication(req.params.id, req.user._id);
  const student = await User.findById(application.student).select('+studentProfile.resumeText');
  if (!student) throw new AppError('Student not found', 404);

  application.aiEvaluation = await evaluateApplication({
    job: application.job,
    profile: student.studentProfile || {},
    resumeText: student.studentProfile?.resumeText,
    coverLetter: application.coverLetter,
  });
  await application.save();

  res.status(200).json({ success: true, message: 'AI evaluation ready', aiEvaluation: application.aiEvaluation });
};

module.exports = {
  aiEvaluateApplication,
  createJob,
  getMyJobs,
  getMyJob,
  updateJob,
  setJobActive,
  getJobApplications,
  updateApplication,
  getApplicantResume,
};
