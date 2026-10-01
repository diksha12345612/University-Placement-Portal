// Runs when no route matched the request.
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Every error in the app ends up here, so all error responses have the same shape:
// { success: false, message: '...' }
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';

  // Mongoose schema validation failed (e.g. required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Invalid MongoDB ObjectId, e.g. /api/jobs/abc
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Unique index violated (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    // "studentProfile.rollNumber" -> "rollNumber"
    const field = (Object.keys(err.keyValue || {})[0] || 'Field').split('.').pop();
    message = `${field} already exists`;
  }

  // The document was changed by another request between reading and saving it
  if (err.name === 'VersionError') {
    statusCode = 409;
    message = 'This was already updated by another request. Please refresh the page.';
  }

  // File upload problems (too big, wrong field name, ...)
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File is too large. Maximum size is 2 MB';
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = `Unexpected file field "${err.field}". Please use the upload button.`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again';
  }

  // Body sent with Content-Type: application/json but it is not valid JSON
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  if (statusCode === 500) {
    console.error(err);
    // Do not leak internal error details to users in production
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong on the server';
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
