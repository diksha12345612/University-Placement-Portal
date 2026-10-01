const User = require('../models/User');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

// GET /api/admin/users?role=student
// Private, admin only. Lists users, optionally filtered by role.
const getUsers = async (req, res) => {
  const { role } = req.query;
  const filter = {};

  if (role) {
    if (!['student', 'recruiter', 'admin'].includes(role)) {
      throw new AppError('Role filter must be student, recruiter or admin', 400);
    }
    filter.role = role;
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: users.length, users });
};

// GET /api/admin/recruiters?status=pending
// status: pending (waiting for approval) | approved. Leave empty for all recruiters.
const getRecruiters = async (req, res) => {
  const { status } = req.query;
  const filter = { role: 'recruiter' };

  if (status === 'pending') filter.isApprovedByAdmin = false;
  else if (status === 'approved') filter.isApprovedByAdmin = true;
  else if (status) throw new AppError('Status filter must be pending or approved', 400);

  const recruiters = await User.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: recruiters.length, recruiters });
};

// PATCH /api/admin/recruiters/:id/approval
// Body: { isApproved: true | false }. false removes access (the recruiter can no longer log in).
const setRecruiterApproval = async (req, res) => {
  const { isApproved } = req.body || {};
  if (typeof isApproved !== 'boolean') {
    throw new AppError('isApproved must be true or false', 400);
  }

  const recruiter = await User.findOne({ _id: req.params.id, role: 'recruiter' });
  if (!recruiter) {
    throw new AppError('Recruiter not found', 404);
  }
  if (isApproved && !recruiter.isVerified) {
    throw new AppError('This recruiter has not verified their email yet, so they cannot be approved', 400);
  }

  const wasApproved = recruiter.isApprovedByAdmin;
  recruiter.isApprovedByAdmin = isApproved;
  await recruiter.save();

  // Tell the recruiter by email. If the email fails, the approval is still saved.
  if (isApproved && !wasApproved) {
    sendEmail({
      to: recruiter.email,
      subject: 'Your recruiter account is approved - Placement Portal',
      text: `Hi ${recruiter.name},\n\nThe placement office has approved your recruiter account for ${recruiter.recruiterProfile.companyName}. You can now log in and post jobs.`,
      html: `<p>Hi ${recruiter.name},</p><p>The placement office has approved your recruiter account for <b>${recruiter.recruiterProfile.companyName}</b>. You can now log in and post jobs.</p>`,
    }).catch((error) => console.error(`Approval email failed: ${error.message}`));
  }

  res.status(200).json({
    success: true,
    message: isApproved ? 'Recruiter approved' : 'Recruiter access removed',
    recruiter,
  });
};

// GET /api/admin/jobs?status=pending
// All jobs with the recruiter's name and email, newest first.
const getJobs = async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status) {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new AppError('Status filter must be pending, approved or rejected', 400);
    }
    filter.status = status;
  }

  const jobs = await Job.find(filter).populate('postedBy', 'name email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: jobs.length, jobs });
};

// PATCH /api/admin/jobs/:id/review
// Body: { status: 'approved' | 'rejected', rejectionReason?: string }
const reviewJob = async (req, res) => {
  const { status, rejectionReason } = req.body || {};

  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Status must be approved or rejected', 400);
  }
  const reason = String(rejectionReason || '').trim();
  if (status === 'rejected' && !reason) {
    throw new AppError('Please give a reason for rejecting the job', 400);
  }
  if (reason.length > 300) {
    throw new AppError('Reason cannot be longer than 300 characters', 400);
  }

  const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  job.status = status;
  job.rejectionReason = status === 'rejected' ? reason : undefined;
  job.reviewedAt = new Date();
  await job.save();

  await createNotification({
    user: job.postedBy._id,
    title: status === 'approved' ? 'Job approved' : 'Job rejected',
    message:
      status === 'approved'
        ? `"${job.title}" is now live for students.`
        : `"${job.title}" was rejected: ${reason}`,
    type: 'job',
    link: '/recruiter/jobs',
  });

  res.status(200).json({
    success: true,
    message: status === 'approved' ? 'Job approved. Students can now see it.' : 'Job rejected',
    job,
  });
};

module.exports = { getUsers, getRecruiters, setRecruiterApproval, getJobs, reviewJob };
