const jwt = require('jsonwebtoken');

// The token stores only the user id and role. Never put the password or other private data in it.
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
