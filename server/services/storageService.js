const cloudinary = require('../config/cloudinary');

// Resumes are uploaded as PRIVATE raw files. Their normal URL does not work for anyone.
// To view one, the backend first checks who is asking, then creates a signed link that expires.
const RESUME_OPTIONS = { resource_type: 'raw', type: 'private' };
const SIGNED_URL_MINUTES = 10;

const uploadResumeFile = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...RESUME_OPTIONS,
        folder: 'placement-portal/resumes',
        public_id: `${userId}-${Date.now()}.pdf`, // raw files keep the extension in the id
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

const deleteResumeFile = (publicId) => {
  return cloudinary.uploader.destroy(publicId, { ...RESUME_OPTIONS, invalidate: true });
};

const getResumeSignedUrl = (publicId) => {
  return cloudinary.utils.private_download_url(publicId, '', {
    ...RESUME_OPTIONS,
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_MINUTES * 60,
  });
};

// Profile photos are normal public images (they are shown as avatars), cropped to a
// 300x300 square around the face so every avatar looks the same.
const uploadPhotoFile = (buffer, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'placement-portal/photos',
        public_id: `${userId}-${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

const deletePhotoFile = (publicId) => cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });

module.exports = {
  uploadResumeFile,
  deleteResumeFile,
  getResumeSignedUrl,
  uploadPhotoFile,
  deletePhotoFile,
  SIGNED_URL_MINUTES,
};
