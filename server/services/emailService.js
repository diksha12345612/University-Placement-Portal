const nodemailer = require('nodemailer');

const isEmailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// Gmail SMTP. EMAIL_PASS must be a 16-character Google "App Password", not your normal Gmail password.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  // In development without Gmail settings, print the email in the terminal so you can still test.
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email is not configured on the server');
    }
    console.log(`\n----- DEV EMAIL (not really sent) -----\nTo: ${to}\nSubject: ${subject}\n${text}\n---------------------------------------\n`);
    return;
  }

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'Placement Portal'}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendOtpEmail = ({ to, name, otp, purpose, expiryMinutes }) => {
  const action = purpose === 'verify-email' ? 'verify your email' : 'reset your password';
  const subject = purpose === 'verify-email' ? 'Verify your email - Placement Portal' : 'Password reset OTP - Placement Portal';

  const text = `Hi ${name},\n\nYour OTP to ${action} is: ${otp}\nIt is valid for ${expiryMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #1e40af;">University Placement Portal</h2>
      <p>Hi ${name},</p>
      <p>Your OTP to ${action} is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
      <p>It is valid for <b>${expiryMinutes} minutes</b>. Do not share it with anyone.</p>
      <p style="color: #6b7280; font-size: 13px;">If you did not request this, you can ignore this email.</p>
    </div>`;

  return sendEmail({ to, subject, text, html });
};

module.exports = { sendEmail, sendOtpEmail };
