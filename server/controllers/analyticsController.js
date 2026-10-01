const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const { APPLICATION_STATUSES } = require('../config/constants');

// GET /api/admin/stats?batch=2026
// Private, admin only. Numbers and chart data for the admin dashboard.
// MongoDB aggregation does the counting inside the database, so we never load every student into memory.
const getStats = async (req, res) => {
  const studentFilter = { role: 'student' };

  if (req.query.batch) {
    const batch = Number(req.query.batch);
    if (!Number.isInteger(batch)) throw new AppError('Batch must be a year like 2026', 400);
    studentFilter['studentProfile.batch'] = batch;
  }

  const [
    totalStudents,
    placedStudents,
    departmentGroups,
    companyGroups,
    statusGroups,
    totalRecruiters,
    pendingRecruiters,
    pendingJobs,
    openJobs,
    batches,
  ] = await Promise.all([
    User.countDocuments(studentFilter),
    User.countDocuments({ ...studentFilter, 'studentProfile.isPlaced': true }),

    // One row per department: how many students, how many of them are placed
    User.aggregate([
      { $match: studentFilter },
      {
        $group: {
          _id: '$studentProfile.department',
          total: { $sum: 1 },
          placed: { $sum: { $cond: ['$studentProfile.isPlaced', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // One row per company: how many students it placed
    User.aggregate([
      { $match: { ...studentFilter, 'studentProfile.isPlaced': true } },
      { $group: { _id: '$studentProfile.placedAt', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),

    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

    User.countDocuments({ role: 'recruiter' }),
    User.countDocuments({ role: 'recruiter', isApprovedByAdmin: false }),
    Job.countDocuments({ status: 'pending' }),
    Job.countDocuments({ status: 'approved', isActive: true, deadline: { $gte: new Date() } }),

    // For the batch filter dropdown
    User.distinct('studentProfile.batch', { role: 'student', 'studentProfile.batch': { $ne: null } }),
  ]);

  const applicationStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  statusGroups.forEach((g) => (applicationStatus[g._id] = g.count));

  res.status(200).json({
    success: true,
    stats: {
      totalStudents,
      placedStudents,
      // one decimal place, and no divide-by-zero when there are no students
      placementPercentage: totalStudents ? Math.round((placedStudents / totalStudents) * 1000) / 10 : 0,
      totalRecruiters,
      pendingRecruiters,
      pendingJobs,
      openJobs,
      totalApplications: Object.values(applicationStatus).reduce((a, b) => a + b, 0),
      applicationStatus,
      departmentWise: departmentGroups.map((g) => ({
        department: g._id || 'Not set',
        total: g.total,
        placed: g.placed,
        percentage: g.total ? Math.round((g.placed / g.total) * 1000) / 10 : 0,
      })),
      companyWise: companyGroups.map((g) => ({ company: g._id || 'Unknown', placed: g.count })),
      batches: batches.sort((a, b) => b - a),
    },
  });
};

// GET /api/public/stats
// Public (no login). Only totals for the landing page, never any personal data.
const getPublicStats = async (req, res) => {
  const [students, placedStudents, companies, openJobs] = await Promise.all([
    User.countDocuments({ role: 'student', isVerified: true }),
    User.countDocuments({ role: 'student', 'studentProfile.isPlaced': true }),
    User.distinct('recruiterProfile.companyName', { role: 'recruiter', isApprovedByAdmin: true }),
    Job.countDocuments({ status: 'approved', isActive: true, deadline: { $gte: new Date() } }),
  ]);

  res.status(200).json({
    success: true,
    stats: { students, placedStudents, companies: companies.length, openJobs },
  });
};

module.exports = { getStats, getPublicStats };
