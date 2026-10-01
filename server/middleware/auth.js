const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// Checks the JWT and puts the logged-in user on req.user.
// Express 5 passes errors thrown in async functions to the error handler automatically.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('You are not logged in. Please provide a token', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid or expired

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('The user for this token no longer exists', 401);
  }

  // If an admin removes a recruiter's approval, their old token should stop working too.
  if (user.role === 'recruiter' && !user.isApprovedByAdmin) {
    throw new AppError('Your recruiter account is not approved by the admin', 403);
  }

  req.user = user;
  next();
};

module.exports = { protect };
