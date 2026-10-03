require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const AppError = require('./utils/AppError');
require('./config/cloudinary'); // sets up Cloudinary with the keys from .env

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicInfoRoutes = require('./routes/publicInfoRoutes');
const mockTestRoutes = require('./routes/mockTestRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Stop early with a clear message if important settings are missing
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing environment variables: ${missingEnv.join(', ')}. Check your .env file.`);
  process.exit(1);
}

const app = express();

// Render puts a proxy in front of the app. This lets Express see the real visitor IP,
// which the rate limiter below needs.
app.set('trust proxy', 1);

// Security headers (removes "X-Powered-By: Express", blocks clickjacking, ...)
app.use(helmet());

// CLIENT_URL can hold several sites separated by commas,
// e.g. "https://myapp.vercel.app,http://localhost:5173"
// A URL never contains spaces or quotes, so any that were pasted in by mistake are removed,
// along with a trailing "/". Browsers send the origin in lowercase, so we compare in lowercase.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.replace(/[\s"']/g, '').replace(/\/+$/, '').toLowerCase())
  .filter(Boolean);
// Printed once at startup (JSON shows hidden characters), so a CORS problem is easy to spot in the logs
console.log(`CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = Postman or a server calling us. CORS is a browser rule, so allow it.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new AppError(`This website (${origin}) is not allowed to use the API`, 403));
    },
  })
);

app.use(express.json({ limit: '1mb' })); // reads JSON request bodies into req.body

// Login, register and OTP routes: few attempts per IP, so nobody can guess passwords or spam OTP emails
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts from this network. Please try again in 15 minutes.' },
});

// A softer limit for the whole API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
});

// Health check stays outside the limiter: Render calls it every few seconds
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api', publicInfoRoutes); // GET /api/drives, /api/announcements, /api/public/stats

// These two must come after all routes
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
