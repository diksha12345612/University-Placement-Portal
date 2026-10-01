const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true }, // bcrypt hash, never the plain 6 digits
    purpose: {
      type: String,
      enum: ['verify-email', 'reset-password'],
      required: true,
    },
    attempts: { type: Number, default: 0 }, // wrong guesses so far
    // TTL index: MongoDB deletes the document automatically once this time has passed.
    // The cleanup job runs about once a minute, so the code also checks expiresAt itself.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
