const mongoose = require('mongoose');
const { DEPARTMENTS, JOB_TYPES, JOB_STATUSES } = require('../config/constants');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot be longer than 100 characters'],
    },
    company: { type: String, required: true, trim: true }, // copied from the recruiter's profile
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: [5000, 'Job description cannot be longer than 5000 characters'],
    },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    type: {
      type: String,
      enum: { values: JOB_TYPES, message: 'Please choose a valid job type' },
      default: 'Full-time',
    },
    salary: { type: String, trim: true, maxlength: 50 }, // text, e.g. "6-8 LPA" or "25,000/month"
    openings: { type: Number, min: 1, default: 1 },
    deadline: { type: Date, required: [true, 'Application deadline is required'] },
    eligibility: {
      minCGPA: { type: Number, min: 0, max: 10, default: 0 }, // 0 = no CGPA rule
      branches: [{ type: String, enum: DEPARTMENTS }], // empty = all branches
      skills: [{ type: String, trim: true }], // preferred skills, shown to students
      batch: { type: Number }, // empty = any batch
    },
    requirements: [{ type: String, trim: true }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: JOB_STATUSES, default: 'pending' },
    rejectionReason: { type: String, trim: true },
    reviewedAt: { type: Date },
    isActive: { type: Boolean, default: true }, // recruiter can close a job early
  },
  { timestamps: true }
);

// Students always search for: approved + active + deadline not passed
jobSchema.index({ status: 1, isActive: 1, deadline: 1 });
// Recruiters list their own jobs, newest first
jobSchema.index({ postedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
