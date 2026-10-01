const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['interviewer', 'candidate'], required: true },
    content: { type: String, required: true },
    // Only on candidate messages: the AI's comment and a 0-10 score for that answer
    feedback: String,
    score: { type: Number, min: 0, max: 10 },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, trim: true, maxlength: 60 }, // e.g. "Frontend Developer"
    interviewType: { type: String, enum: ['technical', 'hr'], default: 'technical' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    totalQuestions: { type: Number, default: 5 },
    messages: [messageSchema],
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    result: {
      overallScore: { type: Number, min: 0, max: 100 },
      strengths: [String],
      improvements: [String],
      summary: String,
    },
  },
  {
    timestamps: true,
    // If two answers for the same question arrive together, the second save fails with a
    // VersionError instead of adding a duplicate (the AI call in between takes a few seconds).
    optimisticConcurrency: true,
  }
);

mockInterviewSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
