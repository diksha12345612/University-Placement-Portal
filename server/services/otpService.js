const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const AppError = require('../utils/AppError');
const { sendOtpEmail } = require('./emailService');

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

// Creates a new 6-digit OTP, stores its hash, and emails the plain OTP to the user.
const createAndSendOtp = async (email, purpose, name) => {
  // Stop users from asking for a new OTP every second
  const existing = await OTP.findOne({ email, purpose });
  if (existing) {
    const secondsPassed = (Date.now() - existing.createdAt.getTime()) / 1000;
    if (secondsPassed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsPassed);
      throw new AppError(`Please wait ${wait} seconds before requesting a new OTP`, 429);
    }
  }

  // crypto.randomInt is secure randomness, unlike Math.random
  const otp = crypto.randomInt(100000, 1000000).toString();

  await OTP.deleteMany({ email, purpose }); // only one valid OTP at a time
  const record = await OTP.create({
    email,
    purpose,
    otp: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  try {
    await sendOtpEmail({ to: email, name, otp, purpose, expiryMinutes: OTP_EXPIRY_MINUTES });
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    await record.deleteOne(); // so the user can retry immediately
    throw new AppError('Could not send the OTP email. Please try again later', 500);
  }
};

// Throws an AppError if the OTP is wrong or expired. Deletes the OTP when it is used successfully.
const verifyOtp = async (email, purpose, otp) => {
  const record = await OTP.findOne({ email, purpose, expiresAt: { $gt: new Date() } });

  if (!record) {
    throw new AppError('OTP has expired or was not requested. Please request a new one', 400);
  }

  const isMatch = await bcrypt.compare(String(otp), record.otp);

  if (!isMatch) {
    record.attempts += 1;
    const attemptsLeft = MAX_ATTEMPTS - record.attempts;

    if (attemptsLeft <= 0) {
      await record.deleteOne();
      throw new AppError('Too many wrong attempts. Please request a new OTP', 429);
    }

    await record.save();
    throw new AppError(`Invalid OTP. ${attemptsLeft} attempt(s) left`, 400);
  }

  await OTP.deleteMany({ email, purpose }); // an OTP can be used only once
};

module.exports = { createAndSendOtp, verifyOtp };
