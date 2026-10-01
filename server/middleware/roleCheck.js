const AppError = require('../utils/AppError');

// Use after protect. Example: router.get('/users', protect, authorize('admin'), getUsers)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Only ${allowedRoles.join(' or ')} can access this route`, 403)
      );
    }
    next();
  };
};

module.exports = { authorize };
