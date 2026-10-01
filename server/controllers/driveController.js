const PlacementDrive = require('../models/PlacementDrive');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { DRIVE_STATUSES } = require('../config/constants');
const { isDateString, startOfDayIST, todayIST } = require('../utils/dates');
const { notifyMany } = require('../services/notificationService');

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const checkLength = (value, label, max) => {
  if (!isEmpty(value) && String(value).trim().length > max) {
    throw new AppError(`${label} cannot be longer than ${max} characters`, 400);
  }
};

// Checks the drive form and returns only the allowed fields
const validateDrive = (body, isNew) => {
  const { title, company, date, venue, description, eligibility, schedule, status } = body || {};

  if (isEmpty(title) || isEmpty(company) || isEmpty(date) || isEmpty(venue)) {
    throw new AppError('Title, company, date and venue are required', 400);
  }
  if (!isDateString(date) || Number.isNaN(startOfDayIST(date).getTime())) {
    throw new AppError('Date must be in YYYY-MM-DD format', 400);
  }
  // A new drive cannot be in the past. Editing an old drive (e.g. marking it completed) is fine.
  if (isNew && date < todayIST()) {
    throw new AppError('Drive date cannot be in the past', 400);
  }
  if (!isEmpty(status) && !DRIVE_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${DRIVE_STATUSES.join(', ')}`, 400);
  }

  checkLength(title, 'Title', 100);
  checkLength(company, 'Company', 100);
  checkLength(venue, 'Venue', 150);
  checkLength(description, 'Description', 3000);
  checkLength(eligibility, 'Eligibility', 500);

  let cleanSchedule = [];
  if (schedule !== undefined && schedule !== null) {
    if (!Array.isArray(schedule)) throw new AppError('Schedule must be a list', 400);
    if (schedule.length > 20) throw new AppError('Schedule can have at most 20 rows', 400);
    cleanSchedule = schedule.map((row) => {
      if (!row || isEmpty(row.time) || isEmpty(row.activity)) {
        throw new AppError('Every schedule row needs a time and an activity', 400);
      }
      return { time: String(row.time).trim(), activity: String(row.activity).trim() };
    });
  }

  return {
    title: String(title).trim(),
    company: String(company).trim(),
    date: startOfDayIST(date),
    venue: String(venue).trim(),
    description: isEmpty(description) ? undefined : String(description).trim(),
    eligibility: isEmpty(eligibility) ? undefined : String(eligibility).trim(),
    schedule: cleanSchedule,
    status: status || 'upcoming',
  };
};

// GET /api/admin/drives  (admin: all drives, newest date first)
const getAllDrives = async (req, res) => {
  const drives = await PlacementDrive.find().sort({ date: -1 });
  res.status(200).json({ success: true, count: drives.length, drives });
};

// POST /api/admin/drives
// Every verified student gets a notification about the new drive.
const createDrive = async (req, res) => {
  const data = validateDrive(req.body, true);
  const drive = await PlacementDrive.create({ ...data, createdBy: req.user._id });

  const students = await User.find({ role: 'student', isVerified: true }).select('_id');
  await notifyMany(
    students.map((s) => s._id),
    {
      title: 'New placement drive',
      message: `${drive.company}: ${drive.title} on ${drive.date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })} at ${drive.venue}.`,
      type: 'drive',
      link: '/student/drives',
    }
  );

  res.status(201).json({ success: true, message: `Drive created and ${students.length} students notified`, drive });
};

// PUT /api/admin/drives/:id
const updateDrive = async (req, res) => {
  const drive = await PlacementDrive.findById(req.params.id);
  if (!drive) throw new AppError('Drive not found', 404);

  Object.assign(drive, validateDrive(req.body, false));
  await drive.save();

  res.status(200).json({ success: true, message: 'Drive updated', drive });
};

// DELETE /api/admin/drives/:id
const deleteDrive = async (req, res) => {
  const drive = await PlacementDrive.findByIdAndDelete(req.params.id);
  if (!drive) throw new AppError('Drive not found', 404);
  res.status(200).json({ success: true, message: 'Drive deleted' });
};

// GET /api/drives  (any logged-in user: upcoming and ongoing drives, soonest first)
const getActiveDrives = async (req, res) => {
  const drives = await PlacementDrive.find({ status: { $in: ['upcoming', 'ongoing'] } }).sort({ date: 1 });
  res.status(200).json({ success: true, count: drives.length, drives });
};

module.exports = { getAllDrives, createDrive, updateDrive, deleteDrive, getActiveDrives };
