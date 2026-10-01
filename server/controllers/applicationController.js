const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const { checkEligibility } = require('../utils/eligibility');
const { createNotification } = require('../services/notificationService');

// POST /api/jobs/:id/apply
// Private, student only. Body: { coverLetter?: string }
// Every rule is checked here on the server, even though the frontend also hides the button.
const applyToJob = async (req, res) => {
  const coverLetter = String((req.body && req.body.coverLetter) || '').trim();
  if (coverLetter.length > 2000) {
    throw new AppError('Cover letter cannot be longer than 2000 characters', 400);
  }

  // 1. The job must be approved, active and before its deadline
  const job = await Job.findOne({
    _id: req.params.id,
    status: 'approved',
    isActive: true,
    deadline: { $gte: new Date() },
  });
  if (!job) {
    throw new AppError('This job is not open for applications', 404);
  }

  // 2. The student must have a resume
  const profile = req.user.studentProfile || {};
  if (!profile.resumePublicId) {
    throw new AppError('Please upload your resume in My Profile before applying', 400);
  }

  // 3. The student must meet the eligibility rules (CGPA, branch, batch)
  const { isEligible, reasons } = checkEligibility(profile, job);
  if (!isEligible) {
    throw new AppError(`You are not eligible for this job. ${reasons.join(' ')}`, 403);
  }

  // 4. Only one application per job
  const existing = await Application.findOne({ job: job._id, student: req.user._id });
  if (existing) {
    throw new AppError('You have already applied to this job', 409);
  }

  let application;
  try {
    application = await Application.create({
      job: job._id,
      student: req.user._id,
      coverLetter: coverLetter || undefined,
      statusHistory: [{ status: 'applied', changedAt: new Date() }],
    });
  } catch (error) {
    // Two clicks at the same moment: the unique index stops the second one
    if (error.code === 11000) throw new AppError('You have already applied to this job', 409);
    throw error;
  }

  await createNotification({
    user: job.postedBy,
    title: 'New applicant',
    message: `${req.user.name} applied for ${job.title}.`,
    type: 'application',
    link: `/recruiter/jobs/${job._id}/applicants`,
  });

  res.status(201).json({ success: true, message: 'Application submitted successfully', application });
};

// GET /api/applications/me
// Private, student only. The recruiter's private notes are left out.
const getMyApplications = async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .select('-notes -aiEvaluation')
    .populate('job', 'title company location type salary deadline isActive')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: applications.length, applications });
};

// DELETE /api/applications/:id
// Private, student only. Allowed only while the status is still "applied".
const withdrawApplication = async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, student: req.user._id });
  if (!application) {
    throw new AppError('Application not found', 404);
  }
  if (application.status !== 'applied') {
    throw new AppError('You can only withdraw an application before the recruiter has reviewed it', 400);
  }

  await application.deleteOne();
  res.status(200).json({ success: true, message: 'Application withdrawn' });
};

module.exports = { applyToJob, getMyApplications, withdrawApplication };
