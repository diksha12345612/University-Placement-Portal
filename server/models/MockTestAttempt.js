const mongoose = require('mongoose');

// One row per question in a finished attempt. The question text and correct answer are
// COPIED here, so the result still makes sense even if the admin edits the test later.
const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    question: String,
    type: String,
    options: [String],
    answer: { type: String, default: '' }, // what the student chose / typed ('' = skipped)
    correctAnswer: String,
    isCorrect: { type: Boolean, default: false },
    points: Number, // how much the question was worth
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const mockTestAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true }, // startedAt + duration, decided by the SERVER
    completedAt: Date,
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    timedOut: { type: Boolean, default: false }, // submitted too late or never submitted
  },
  { timestamps: true }
);

mockTestAttemptSchema.index({ student: 1, test: 1, status: 1 });
// At most ONE unfinished attempt per student per test, even if two "start" requests arrive together
mockTestAttemptSchema.index(
  { student: 1, test: 1 },
  { unique: true, partialFilterExpression: { status: 'in-progress' }, name: 'one_in_progress_attempt' }
);
mockTestAttemptSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('MockTestAttempt', mockTestAttemptSchema);
