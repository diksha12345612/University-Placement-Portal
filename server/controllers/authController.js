const User = require('../models/User');
const OTP = require('../models/OTP');
const AppError = require('../utils/AppError');
const generateToken = require('../utils/generateToken');
const { createAndSendOtp, verifyOtp } = require('../services/otpService');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const OTP_REGEX = /^\d{6}$/;

const normalizeEmail = (email) => String(email).toLowerCase().trim();

// POST /api/auth/register
// Public. Only students and recruiters can register here. Admins are created by the seed script.
const register = async (req, res) => {
  const { name, email, password, role = 'student', companyName, designation, website, phone } =
    req.body || {};

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Please enter a valid email', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }
  if (!['student', 'recruiter'].includes(role)) {
    throw new AppError('Role must be either student or recruiter', 400);
  }
  if (role === 'recruiter' && !companyName) {
    throw new AppError('Company name is required for recruiters', 400);
  }

  const existingUser = await User.findOne({ email: normalizeEmail(email) });
  if (existingUser) {
    if (!existingUser.isVerified) {
      throw new AppError(
        'This email is already registered but not verified. Please verify it with the OTP or request a new OTP',
        409
      );
    }
    throw new AppError('An account with this email already exists', 409);
  }

  const userData = { name, email, password, role };

  if (role === 'student') {
    userData.isApprovedByAdmin = true; // students do not need admin approval
    userData.studentProfile = {}; // filled in later from the profile page
  } else {
    userData.isApprovedByAdmin = false; // recruiters must wait for the admin
    userData.recruiterProfile = { companyName, designation, website, phone };
  }

  const user = await User.create(userData);

  // Remove any old OTPs for this email, then send a fresh one.
  // If the email cannot be sent, undo the registration so the user can simply try again.
  try {
    await OTP.deleteMany({ email: user.email });
    await createAndSendOtp(user.email, 'verify-email', user.name);
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. We have sent a 6-digit OTP to your email to verify your account.',
    user,
  });
};

// POST /api/auth/verify-email
// Public. Body: { email, otp }
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400);
  }
  if (!OTP_REGEX.test(String(otp))) {
    throw new AppError('OTP must be a 6-digit number', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }
  if (user.isVerified) {
    return res.status(200).json({ success: true, message: 'Email is already verified. You can log in.' });
  }

  await verifyOtp(user.email, 'verify-email', otp);

  user.isVerified = true;
  await user.save();

  const message =
    user.role === 'recruiter'
      ? 'Email verified. You can log in after the admin approves your account.'
      : 'Email verified successfully. You can now log in.';

  res.status(200).json({ success: true, message });
};

// POST /api/auth/resend-otp
// Public. Body: { email }. Sends a new email-verification OTP.
const resendOtp = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) {
    throw new AppError('No account found with this email', 404);
  }
  if (user.isVerified) {
    throw new AppError('Email is already verified. You can log in.', 400);
  }

  await createAndSendOtp(user.email, 'verify-email', user.name);

  res.status(200).json({ success: true, message: 'A new OTP has been sent to your email' });
};

// POST /api/auth/login
// Public.
const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // password has select: false in the schema, so we must ask for it here
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

  // Same message for "no user" and "wrong password", so attackers cannot find out which emails exist
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isVerified) {
    // needsVerification tells the frontend to open the OTP page
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in',
      needsVerification: true,
    });
  }

  if (user.role === 'recruiter' && !user.isApprovedByAdmin) {
    throw new AppError('Your account is waiting for admin approval', 403);
  }

  const token = generateToken(user);

  res.status(200).json({ success: true, message: 'Login successful', token, user });
};

// POST /api/auth/forgot-password
// Public. Body: { email }. Sends a password-reset OTP.
const forgotPassword = async (req, res) => {
  const { email } = req.body || {};

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError('Please enter a valid email', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });

  // Same reply whether or not the account exists, so this route cannot be used to find registered emails
  if (user) {
    await createAndSendOtp(user.email, 'reset-password', user.name);
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset OTP has been sent',
  });
};

// POST /api/auth/reset-password
// Public. Body: { email, otp, newPassword }
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body || {};

  if (!email || !otp || !newPassword) {
    throw new AppError('Email, OTP and new password are required', 400);
  }
  if (!OTP_REGEX.test(String(otp))) {
    throw new AppError('OTP must be a 6-digit number', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) {
    throw new AppError('Invalid email or OTP', 400);
  }

  await verifyOtp(user.email, 'reset-password', otp);

  user.password = newPassword; // hashed by the pre-save hook
  user.isVerified = true; // receiving the OTP proves they own this email
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
};

// GET /api/auth/me
// Private (any logged-in user). The frontend uses this to restore the session on page refresh.
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { register, verifyEmail, resendOtp, login, forgotPassword, resetPassword, getMe };
