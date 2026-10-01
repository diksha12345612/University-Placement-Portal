const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { DEPARTMENTS } = require('../config/constants');

const experienceSchema = new mongoose.Schema({
  company: { type: String, trim: true, required: [true, 'Company name is required in every experience entry'] },
  role: { type: String, trim: true, required: [true, 'Role is required in every experience entry'] },
  startDate: Date,
  endDate: Date,
  description: { type: String, trim: true, maxlength: [1000, 'Experience description is too long'] },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, trim: true, required: [true, 'Title is required in every project'] },
  description: { type: String, trim: true, maxlength: [1000, 'Project description is too long'] },
  techStack: [{ type: String, trim: true }],
  link: { type: String, trim: true },
});

const certificateSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: [true, 'Name is required in every certificate'] },
  issuer: { type: String, trim: true },
  issueDate: Date,
  url: { type: String, trim: true },
});

const aiResumeAnalysisSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    // five parts of 0-20 each; score = their sum
    breakdown: {
      technicalSkills: { type: Number, min: 0, max: 20 },
      projects: { type: Number, min: 0, max: 20 },
      experience: { type: Number, min: 0, max: 20 },
      atsScore: { type: Number, min: 0, max: 20 },
      clarity: { type: Number, min: 0, max: 20 },
    },
    strengths: [String],
    weaknesses: [String],
    missingSkills: [String],
    suggestions: [String],
    analyzedAt: Date,
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    rollNumber: { type: String, trim: true, uppercase: true },
    department: {
      type: String,
      enum: { values: DEPARTMENTS, message: 'Please choose a valid department' },
    },
    batch: { type: Number }, // passing-out year, e.g. 2026
    cgpa: { type: Number, min: [0, 'CGPA cannot be below 0'], max: [10, 'CGPA cannot be above 10'] },
    phone: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    tenthPercentage: { type: Number, min: 0, max: 100 },
    twelfthPercentage: { type: Number, min: 0, max: 100 },
    experience: [experienceSchema],
    projects: [projectSchema],
    certificates: [certificateSchema],
    // The resume is a private Cloudinary file, so we store its id (not a public URL).
    // A short-lived link is created from this id whenever someone allowed views it.
    resumePublicId: { type: String },
    resumeFileName: { type: String }, // original file name, shown in the UI
    resumeUploadedAt: { type: Date },
    resumeText: { type: String, select: false }, // text extracted by pdf-parse, used by AI
    linkedIn: { type: String, trim: true },
    github: { type: String, trim: true },
    photoUrl: { type: String }, // public Cloudinary image, shown as the avatar
    photoPublicId: { type: String },
    isPlaced: { type: Boolean, default: false },
    placedAt: { type: String, trim: true }, // company name the student was placed at
    aiResumeAnalysis: aiResumeAnalysisSchema,
  },
  { _id: false }
);

const recruiterProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, required: [true, 'Company name is required'] },
    designation: { type: String, trim: true },
    website: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot be longer than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by queries unless we ask for it with .select('+password')
    },
    role: {
      type: String,
      enum: ['student', 'recruiter', 'admin'],
      default: 'student',
    },
    isVerified: { type: Boolean, default: false }, // email verified with OTP (Phase 2)
    isApprovedByAdmin: { type: Boolean, default: false }, // only matters for recruiters
    // "default: undefined" means a recruiter will not get an empty studentProfile, and vice versa
    studentProfile: { type: studentProfileSchema, default: undefined },
    recruiterProfile: { type: recruiterProfileSchema, default: undefined },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

// Two students cannot have the same roll number. "partialFilterExpression" makes the rule apply
// only when a roll number is set, because many students will not have filled it in yet.
userSchema.index(
  { 'studentProfile.rollNumber': 1 },
  { unique: true, partialFilterExpression: { 'studentProfile.rollNumber': { $type: 'string' } } }
);

// Hash the password before saving, but only if it was changed (so we never hash a hash).
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove private fields whenever a user is sent as JSON in a response.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    if (ret.studentProfile) delete ret.studentProfile.resumeText;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
