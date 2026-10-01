require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
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

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' })); // reads JSON request bodies into req.body

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api', publicInfoRoutes); // GET /api/drives and GET /api/announcements

// These two must come after all routes
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
