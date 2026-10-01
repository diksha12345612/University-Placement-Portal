// A normal Error that also carries an HTTP status code.
// Usage: throw new AppError('Job not found', 404);
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
