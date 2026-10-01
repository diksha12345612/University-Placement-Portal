const mongoose = require('mongoose');
const { ANNOUNCEMENT_PRIORITIES, ANNOUNCEMENT_AUDIENCES } = require('../config/constants');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    content: { type: String, required: [true, 'Content is required'], trim: true, maxlength: 3000 },
    priority: { type: String, enum: ANNOUNCEMENT_PRIORITIES, default: 'normal' },
    targetAudience: { type: String, enum: ANNOUNCEMENT_AUDIENCES, default: 'all' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // After this time students/recruiters stop seeing it. Not a TTL index, because
    // the admin should still see old announcements in their list.
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

announcementSchema.index({ targetAudience: 1, expiresAt: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
