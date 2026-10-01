const mongoose = require('mongoose');
const { APPLICATION_STATUSES } = require('../config/constants');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied' },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover letter cannot be longer than 2000 characters'],
    },
    // Private notes by the recruiter. Never sent to the student.
    notes: { type: String, trim: true, maxlength: [1000, 'Notes cannot be longer than 1000 characters'] },
    // Every status change with its time, so the student can see a timeline
    statusHistory: [
      {
        status: { type: String, enum: APPLICATION_STATUSES },
        changedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    // Filled when the recruiter asks the AI for a match score. Advice only: the recruiter decides.
    aiEvaluation: {
      matchScore: { type: Number, min: 0, max: 100 },
      strengthSummary: String,
      recommendation: { type: String, enum: ['Strong fit', 'Possible fit', 'Not a fit'] },
      evaluatedAt: Date,
    },
  },
  { timestamps: true }
);

// A student can apply to a job only once. The database itself refuses a second copy,
// even if two requests arrive at the same moment.
applicationSchema.index({ job: 1, student: 1 }, { unique: true });
applicationSchema.index({ student: 1, createdAt: -1 }); // "My applications"
applicationSchema.index({ job: 1, status: 1 }); // recruiter's applicant list

module.exports = mongoose.model('Application', applicationSchema);
