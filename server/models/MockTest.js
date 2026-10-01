const mongoose = require('mongoose');
const { TEST_CATEGORIES, QUESTION_TYPES } = require('../config/constants');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  type: { type: String, enum: QUESTION_TYPES, default: 'mcq' },
  options: [{ type: String, trim: true }], // only for mcq
  // For mcq: the text of the correct option. For short: the expected answer.
  // Never sent to students before they submit (the controller removes it).
  correctAnswer: { type: String, required: true, trim: true },
  points: { type: Number, min: 1, max: 10, default: 1 },
});

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: TEST_CATEGORIES, required: true },
    description: { type: String, trim: true },
    duration: { type: Number, required: true, min: 1, max: 180 }, // minutes
    questions: [questionSchema],
    isPublished: { type: Boolean, default: false }, // students see only published tests
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

mockTestSchema.index({ isPublished: 1, category: 1 });

module.exports = mongoose.model('MockTest', mockTestSchema);
