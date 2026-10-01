const mongoose = require('mongoose');
const { DRIVE_STATUSES } = require('../config/constants');

// A campus placement event organised by the placement office (e.g. "Infosys campus drive")
const placementDriveSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 100 },
    company: { type: String, required: [true, 'Company is required'], trim: true, maxlength: 100 },
    date: { type: Date, required: [true, 'Date is required'] },
    venue: { type: String, required: [true, 'Venue is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 3000 },
    eligibility: { type: String, trim: true, maxlength: 500 }, // free text, e.g. "CSE, IT with CGPA 7+"
    schedule: [
      {
        time: { type: String, trim: true, required: true }, // e.g. "10:00 AM"
        activity: { type: String, trim: true, required: true }, // e.g. "Aptitude test"
        _id: false,
      },
    ],
    status: { type: String, enum: DRIVE_STATUSES, default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

placementDriveSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
