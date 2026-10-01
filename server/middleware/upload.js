const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_RESUME_SIZE_MB = 2;
const MAX_PHOTO_SIZE_MB = 2;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// memoryStorage keeps the file in RAM (req.file.buffer) instead of saving it to disk.
// We send that buffer straight to Cloudinary (or read it with pdf-parse), so it works the
// same locally and on Render (Render's disk is wiped on every restart).
const pdfUpload = (fieldName) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_SIZE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new AppError('Only PDF files are allowed', 400));
      }
      cb(null, true);
    },
  }).single(fieldName);

const uploadResume = pdfUpload('resume'); // the form field must be named "resume"
const uploadLinkedInPdf = pdfUpload('linkedin');

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!PHOTO_TYPES.includes(file.mimetype)) {
      return cb(new AppError('Only JPG, PNG or WebP images are allowed', 400));
    }
    cb(null, true);
  },
}).single('photo');

// The browser's file type can be faked, so the controllers also check the first bytes
// of the file ("magic numbers") to make sure it really is what it claims to be.
const isPdf = (buffer) => buffer.subarray(0, 4).toString() === '%PDF';

const isImage = (buffer) => {
  const jpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
};

module.exports = { uploadResume, uploadLinkedInPdf, uploadPhoto, isPdf, isImage, MAX_RESUME_SIZE_MB };
