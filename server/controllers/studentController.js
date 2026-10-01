const AppError = require('../utils/AppError');
const { DEPARTMENTS } = require('../config/constants');
const User = require('../models/User');
const { extractPdfText } = require('../services/pdfService');
const { analyzeResume: analyzeResumeWithAi, extractLinkedInProfile } = require('../services/aiService');
const { uploadPhotoFile, deletePhotoFile } = require('../services/storageService');
const { isPdf, isImage } = require('../middleware/upload');
const { checkRateLimit } = require('../utils/rateLimit');
const {
  uploadResumeFile,
  deleteResumeFile,
  getResumeSignedUrl,
  SIGNED_URL_MINUTES,
} = require('../services/storageService');

// Fields a student may edit. isPlaced, placedAt, aiResumeAnalysis and the resume fields
// are NOT here, so a student cannot mark themselves "placed" by sending extra JSON.
const EDITABLE_FIELDS = [
  'rollNumber',
  'department',
  'batch',
  'cgpa',
  'phone',
  'skills',
  'tenthPercentage',
  'twelfthPercentage',
  'experience',
  'projects',
  'certificates',
  'linkedIn',
  'github',
];

const isEmpty = (value) => value === undefined || value === null || value === '';
const URL_REGEX = /^https?:\/\/\S+$/i;

const checkNumber = (value, label, min, max) => {
  if (isEmpty(value)) return;
  const number = Number(value);
  if (Number.isNaN(number) || number < min || number > max) {
    throw new AppError(`${label} must be a number between ${min} and ${max}`, 400);
  }
};

const checkUrl = (value, label) => {
  if (!isEmpty(value) && !URL_REGEX.test(String(value).trim())) {
    throw new AppError(`${label} must be a full link starting with http:// or https://`, 400);
  }
};

// Clear, friendly checks first. Mongoose schema validation still runs on save as a second safety net.
const validateProfile = (profile) => {
  checkNumber(profile.cgpa, 'CGPA', 0, 10);
  checkNumber(profile.tenthPercentage, '10th percentage', 0, 100);
  checkNumber(profile.twelfthPercentage, '12th percentage', 0, 100);

  if (!isEmpty(profile.batch)) {
    const batch = Number(profile.batch);
    if (!Number.isInteger(batch) || batch < 2000 || batch > 2100) {
      throw new AppError('Batch must be a passing-out year like 2026', 400);
    }
  }

  if (!isEmpty(profile.department) && !DEPARTMENTS.includes(profile.department)) {
    throw new AppError(`Department must be one of: ${DEPARTMENTS.join(', ')}`, 400);
  }

  if (!isEmpty(profile.phone) && !/^\d{10}$/.test(String(profile.phone).trim())) {
    throw new AppError('Phone number must be 10 digits', 400);
  }

  checkUrl(profile.linkedIn, 'LinkedIn');
  checkUrl(profile.github, 'GitHub');

  if (profile.skills !== undefined) {
    if (!Array.isArray(profile.skills) || profile.skills.some((s) => typeof s !== 'string')) {
      throw new AppError('Skills must be a list of text values', 400);
    }
    if (profile.skills.length > 30) {
      throw new AppError('You can add at most 30 skills', 400);
    }
  }

  for (const key of ['experience', 'projects', 'certificates']) {
    if (profile[key] !== undefined && !Array.isArray(profile[key])) {
      throw new AppError(`${key} must be a list`, 400);
    }
  }

  (profile.projects || []).forEach((p) => checkUrl(p.link, 'Project link'));
  (profile.certificates || []).forEach((c) => checkUrl(c.url, 'Certificate link'));
};

// Removes duplicates like "React" and "react", and empty values
const cleanSkills = (skills) => {
  const seen = new Set();
  return skills
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (!s || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

// GET /api/students/profile
// Private, student only.
const getProfile = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// PUT /api/students/profile
// Private, student only. Body: { name?, studentProfile: { ...fields } }
const updateProfile = async (req, res) => {
  const { name, studentProfile = {} } = req.body || {};
  const user = req.user;

  if (name !== undefined) {
    if (!String(name).trim()) throw new AppError('Name cannot be empty', 400);
    user.name = name;
  }

  validateProfile(studentProfile);

  if (!user.studentProfile) user.studentProfile = {};

  for (const field of EDITABLE_FIELDS) {
    if (studentProfile[field] === undefined) continue; // not sent, keep old value

    let value = studentProfile[field];
    if (value === '' || value === null) value = undefined; // empty input clears the field
    if (field === 'skills') value = cleanSkills(value);

    user.studentProfile[field] = value;
  }

  await user.save(); // schema validation (required fields in projects etc.) runs here

  res.status(200).json({ success: true, message: 'Profile updated successfully', user });
};

// POST /api/students/resume
// Private, student only. multipart/form-data with a PDF in the field "resume".
const uploadResume = async (req, res) => {
  if (!req.file) {
    throw new AppError('Please choose a PDF file to upload', 400);
  }

  // The browser's file type can be faked, so also check the real file content.
  // Every PDF file starts with the characters "%PDF".
  if (req.file.buffer.subarray(0, 4).toString() !== '%PDF') {
    throw new AppError('This file is not a valid PDF', 400);
  }

  // Read the text for AI analysis later. A scanned resume has no text, but it can still be uploaded.
  let resumeText = '';
  try {
    resumeText = await extractPdfText(req.file.buffer);
  } catch (error) {
    console.error(`PDF text extraction failed: ${error.message}`);
  }

  let uploaded;
  try {
    uploaded = await uploadResumeFile(req.file.buffer, req.user._id);
  } catch (error) {
    console.error(`Cloudinary upload failed: ${error.message}`);
    throw new AppError('Could not upload the resume right now. Please try again', 502);
  }

  const user = req.user;
  if (!user.studentProfile) user.studentProfile = {};
  const oldPublicId = user.studentProfile.resumePublicId;

  user.studentProfile.resumePublicId = uploaded.public_id;
  user.studentProfile.resumeFileName = req.file.originalname;
  user.studentProfile.resumeUploadedAt = new Date();
  user.studentProfile.resumeText = resumeText;
  user.studentProfile.aiResumeAnalysis = undefined; // the old analysis was for the old resume
  await user.save();

  // Delete the old file after the new one is saved. If this fails, it is only wasted storage.
  if (oldPublicId) {
    deleteResumeFile(oldPublicId).catch((error) =>
      console.error(`Could not delete old resume ${oldPublicId}: ${error.message}`)
    );
  }

  const message = resumeText
    ? 'Resume uploaded successfully'
    : 'Resume uploaded, but we could not read any text from it (is it a scanned image?). AI analysis needs a text-based PDF.';

  res.status(200).json({ success: true, message, user });
};

// GET /api/students/resume
// Private, student only. Returns a short-lived link to view your own resume.
const getMyResumeUrl = async (req, res) => {
  const publicId = req.user.studentProfile?.resumePublicId;
  if (!publicId) {
    throw new AppError('You have not uploaded a resume yet', 404);
  }

  res.status(200).json({
    success: true,
    url: getResumeSignedUrl(publicId),
    expiresInMinutes: SIGNED_URL_MINUTES,
  });
};

// DELETE /api/students/resume
// Private, student only.
const deleteResume = async (req, res) => {
  const user = req.user;
  const publicId = user.studentProfile?.resumePublicId;
  if (!publicId) {
    throw new AppError('You have not uploaded a resume yet', 404);
  }

  user.studentProfile.resumePublicId = undefined;
  user.studentProfile.resumeFileName = undefined;
  user.studentProfile.resumeUploadedAt = undefined;
  user.studentProfile.resumeText = undefined;
  user.studentProfile.aiResumeAnalysis = undefined;
  await user.save();

  deleteResumeFile(publicId).catch((error) =>
    console.error(`Could not delete resume ${publicId}: ${error.message}`)
  );

  res.status(200).json({ success: true, message: 'Resume deleted', user });
};

const ANALYSIS_COOLDOWN_SECONDS = 60; // protects the free AI quota from repeated clicks

// POST /api/students/resume/analyze
// Private, student only. Sends the resume text to the AI and saves the result on the profile.
const analyzeResume = async (req, res) => {
  // resumeText has select: false, so load it explicitly
  const user = await User.findById(req.user._id).select('+studentProfile.resumeText');
  const profile = user.studentProfile || {};

  if (!profile.resumePublicId) {
    throw new AppError('Upload your resume first', 400);
  }
  if (!profile.resumeText) {
    throw new AppError('We could not read any text from your resume. Upload a text-based PDF (not a scanned image).', 400);
  }

  const lastRun = profile.aiResumeAnalysis?.analyzedAt;
  if (lastRun && Date.now() - lastRun.getTime() < ANALYSIS_COOLDOWN_SECONDS * 1000) {
    throw new AppError('Your resume was analysed less than a minute ago. Please wait a moment.', 429);
  }

  user.studentProfile.aiResumeAnalysis = await analyzeResumeWithAi({
    resumeText: profile.resumeText,
    department: profile.department,
    batch: profile.batch,
    skills: profile.skills,
  });
  await user.save();

  res.status(200).json({ success: true, message: 'Resume analysed', user });
};

// POST /api/students/photo   multipart/form-data with an image in the field "photo"
const uploadPhoto = async (req, res) => {
  if (!req.file) throw new AppError('Please choose an image to upload', 400);
  if (!isImage(req.file.buffer)) throw new AppError('This file is not a valid JPG, PNG or WebP image', 400);

  let uploaded;
  try {
    uploaded = await uploadPhotoFile(req.file.buffer, req.user._id);
  } catch (error) {
    console.error(`Photo upload failed: ${error.message}`);
    throw new AppError('Could not upload the photo right now. Please try again', 502);
  }

  const user = req.user;
  if (!user.studentProfile) user.studentProfile = {};
  const oldPublicId = user.studentProfile.photoPublicId;
  user.studentProfile.photoUrl = uploaded.secure_url;
  user.studentProfile.photoPublicId = uploaded.public_id;
  await user.save();

  if (oldPublicId) {
    deletePhotoFile(oldPublicId).catch((error) => console.error(`Could not delete old photo: ${error.message}`));
  }

  res.status(200).json({ success: true, message: 'Profile photo updated', user });
};

// DELETE /api/students/photo
const deletePhoto = async (req, res) => {
  const user = req.user;
  const publicId = user.studentProfile?.photoPublicId;
  if (!publicId) throw new AppError('You have not uploaded a photo', 404);

  user.studentProfile.photoUrl = undefined;
  user.studentProfile.photoPublicId = undefined;
  await user.save();
  deletePhotoFile(publicId).catch((error) => console.error(`Could not delete photo: ${error.message}`));

  res.status(200).json({ success: true, message: 'Profile photo removed', user });
};

// POST /api/students/linkedin-import   multipart/form-data with the LinkedIn PDF in the field "linkedin"
// Returns the details the AI found. Nothing is saved: the student reviews them in the form and clicks Save.
const importLinkedIn = async (req, res) => {
  if (!req.file) throw new AppError('Please choose your LinkedIn profile PDF', 400);
  if (!isPdf(req.file.buffer)) throw new AppError('This file is not a valid PDF', 400);

  let text = '';
  try {
    text = await extractPdfText(req.file.buffer);
  } catch (error) {
    console.error(`LinkedIn PDF read failed: ${error.message}`);
  }
  if (text.length < 50) {
    throw new AppError('We could not read this PDF. On LinkedIn open your profile, click "More" then "Save to PDF", and upload that file.', 400);
  }

  checkRateLimit(`linkedin:${req.user._id}`, 5, 60 * 60 * 1000, 'You can import a LinkedIn PDF 5 times per hour. Please try again later.');

  const imported = await extractLinkedInProfile(text);
  res.status(200).json({ success: true, message: 'Details found. Check them in the form and click Save profile.', imported });
};

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  getMyResumeUrl,
  deleteResume,
  analyzeResume,
  uploadPhoto,
  deletePhoto,
  importLinkedIn,
};
