const Announcement = require('../models/Announcement');
const AppError = require('../utils/AppError');
const { ANNOUNCEMENT_PRIORITIES, ANNOUNCEMENT_AUDIENCES } = require('../config/constants');
const { isDateString, endOfDayIST, todayIST } = require('../utils/dates');

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const validateAnnouncement = (body, isNew) => {
  const { title, content, priority, targetAudience, expiresAt } = body || {};

  if (isEmpty(title) || isEmpty(content)) {
    throw new AppError('Title and content are required', 400);
  }
  if (String(title).trim().length > 150) throw new AppError('Title cannot be longer than 150 characters', 400);
  if (String(content).trim().length > 3000) throw new AppError('Content cannot be longer than 3000 characters', 400);

  if (!isEmpty(priority) && !ANNOUNCEMENT_PRIORITIES.includes(priority)) {
    throw new AppError(`Priority must be one of: ${ANNOUNCEMENT_PRIORITIES.join(', ')}`, 400);
  }
  if (!isEmpty(targetAudience) && !ANNOUNCEMENT_AUDIENCES.includes(targetAudience)) {
    throw new AppError(`Audience must be one of: ${ANNOUNCEMENT_AUDIENCES.join(', ')}`, 400);
  }

  let expiry; // empty = never expires
  if (!isEmpty(expiresAt)) {
    if (!isDateString(expiresAt)) throw new AppError('Expiry date must be in YYYY-MM-DD format', 400);
    if (isNew && expiresAt < todayIST()) throw new AppError('Expiry date cannot be in the past', 400);
    expiry = endOfDayIST(expiresAt); // visible until the end of that day
  }

  return {
    title: String(title).trim(),
    content: String(content).trim(),
    priority: priority || 'normal',
    targetAudience: targetAudience || 'all',
    expiresAt: expiry,
  };
};

// GET /api/admin/announcements  (admin: all, including expired)
const getAllAnnouncements = async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: announcements.length, announcements });
};

// POST /api/admin/announcements
const createAnnouncement = async (req, res) => {
  const announcement = await Announcement.create({ ...validateAnnouncement(req.body, true), createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Announcement posted', announcement });
};

// PUT /api/admin/announcements/:id
const updateAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError('Announcement not found', 404);

  Object.assign(announcement, validateAnnouncement(req.body, false));
  await announcement.save();
  res.status(200).json({ success: true, message: 'Announcement updated', announcement });
};

// DELETE /api/admin/announcements/:id
const deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) throw new AppError('Announcement not found', 404);
  res.status(200).json({ success: true, message: 'Announcement deleted' });
};

// Which audiences each role may see
const AUDIENCE_FOR_ROLE = {
  student: ['all', 'students'],
  recruiter: ['all', 'recruiters'],
  admin: ANNOUNCEMENT_AUDIENCES,
};

// GET /api/announcements  (any logged-in user: not expired, for their role, newest first)
const getMyAnnouncements = async (req, res) => {
  const announcements = await Announcement.find({
    targetAudience: { $in: AUDIENCE_FOR_ROLE[req.user.role] },
    // "expiresAt: null" also matches announcements with no expiry date
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({ success: true, count: announcements.length, announcements });
};

module.exports = {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getMyAnnouncements,
};
