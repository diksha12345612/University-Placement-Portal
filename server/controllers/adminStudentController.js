const User = require('../models/User');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const { DEPARTMENTS } = require('../config/constants');
const { escapeRegex } = require('../utils/escapeRegex');
const { getResumeSignedUrl, SIGNED_URL_MINUTES } = require('../services/storageService');

// GET /api/admin/students?department=CSE&batch=2026&placed=true&search=diksha
// Private, admin only.
const getStudents = async (req, res) => {
  const { department, batch, placed, search } = req.query;
  const filter = { role: 'student' };

  if (department) {
    if (!DEPARTMENTS.includes(department)) throw new AppError('Invalid department filter', 400);
    filter['studentProfile.department'] = department;
  }
  if (batch) {
    if (!Number.isInteger(Number(batch))) throw new AppError('Batch must be a year like 2026', 400);
    filter['studentProfile.batch'] = Number(batch);
  }
  if (placed === 'true') filter['studentProfile.isPlaced'] = true;
  else if (placed === 'false') filter['studentProfile.isPlaced'] = { $ne: true };
  else if (placed) throw new AppError('placed must be true or false', 400);

  if (search && String(search).trim()) {
    const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { 'studentProfile.rollNumber': pattern }];
  }

  const students = await User.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, count: students.length, students });
};

// GET /api/admin/students/:id
// Full profile plus every application the student has made.
const getStudentDetail = async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new AppError('Student not found', 404);

  const applications = await Application.find({ student: student._id })
    .populate('job', 'title company type location')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, student, applications });
};

// GET /api/admin/students/:id/resume
const getStudentResume = async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new AppError('Student not found', 404);

  const publicId = student.studentProfile?.resumePublicId;
  if (!publicId) throw new AppError('This student has not uploaded a resume', 404);

  res.status(200).json({ success: true, url: getResumeSignedUrl(publicId), expiresInMinutes: SIGNED_URL_MINUTES });
};

module.exports = { getStudents, getStudentDetail, getStudentResume };
