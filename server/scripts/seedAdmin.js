// Creates the first admin (TPO) account using values from .env.
// Run once with: npm run seed:admin
require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Please set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);

    const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });

    if (existingUser) {
      console.log(`A user with email ${ADMIN_EMAIL} already exists (role: ${existingUser.role}). Nothing to do.`);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // hashed by the pre-save hook in the User model
        role: 'admin',
        isVerified: true,
        isApprovedByAdmin: true,
      });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error(`Failed to seed admin: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
