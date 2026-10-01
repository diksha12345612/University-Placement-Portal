// Adds three sample mock tests (Aptitude, Technical, Coding) so the portal has content for a demo.
// Run with: npm run seed:tests   (tests that already exist with the same title are skipped)
require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const User = require('../models/User');
const MockTest = require('../models/MockTest');
const { validateMockTest } = require('../utils/validateMockTest');

const mcq = (question, options, correctAnswer, points = 1) => ({ question, type: 'mcq', options, correctAnswer, points });
const short = (question, correctAnswer, points = 1) => ({ question, type: 'short', correctAnswer, points });

const SAMPLE_TESTS = [
  {
    title: 'Quantitative Aptitude - Basics',
    category: 'Aptitude',
    description: 'Speed, percentages, series, work and interest. No negative marking.',
    duration: 10,
    questions: [
      mcq('A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?', ['36', '40', '45', '54'], '36'),
      mcq('If 20% of a number is 50, what is the number?', ['100', '200', '250', '300'], '250'),
      mcq('What comes next in the series: 2, 6, 12, 20, 30, ?', ['36', '40', '42', '44'], '42'),
      mcq('A can finish a work in 10 days and B in 15 days. In how many days can they finish it together?', ['5', '6', '8', '12.5'], '6', 2),
      short('What is the simple interest (in rupees) on Rs. 1000 at 10% per year for 2 years? (number only)', '200', 2),
    ],
  },
  {
    title: 'Technical Fundamentals',
    category: 'Technical',
    description: 'Data structures, web basics and databases.',
    duration: 10,
    questions: [
      mcq('What is the time complexity of binary search on a sorted array?', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], 'O(log n)'),
      mcq('Which data structure works on LIFO (Last In, First Out)?', ['Queue', 'Stack', 'Tree', 'Graph'], 'Stack'),
      mcq('Which HTTP method is normally used to replace an existing resource?', ['GET', 'POST', 'PUT', 'DELETE'], 'PUT'),
      mcq('In MongoDB, which method returns only the first matching document?', ['find()', 'findOne()', 'getOne()', 'selectOne()'], 'findOne()'),
      mcq('Which of these is NOT a primitive type in JavaScript?', ['string', 'number', 'object', 'boolean'], 'object'),
      short('What does SQL stand for?', 'Structured Query Language', 2),
    ],
  },
  {
    title: 'JavaScript Output Prediction',
    category: 'Coding',
    description: 'Read the code and predict what it prints.',
    duration: 8,
    questions: [
      mcq('What does console.log(typeof null) print?', ['"null"', '"object"', '"undefined"', '"number"'], '"object"'),
      mcq('What does console.log([1, 2, 3].map(x => x * 2)) print?', ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', '6'], '[2, 4, 6]'),
      mcq('What does console.log(0.1 + 0.2 === 0.3) print?', ['true', 'false', 'undefined', 'NaN'], 'false', 2),
      short('What does console.log("5" + 3) print?', '53'),
    ],
  },
];

const seedMockTests = async () => {
  if (!process.env.MONGO_URI) {
    console.error('Please set MONGO_URI in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin found. Run "npm run seed:admin" first.');
      process.exitCode = 1;
      return;
    }

    for (const sample of SAMPLE_TESTS) {
      const exists = await MockTest.findOne({ title: sample.title });
      if (exists) {
        console.log(`Skipped (already exists): ${sample.title}`);
        continue;
      }
      // Same validation as the admin form, so sample data follows the same rules
      await MockTest.create({ ...validateMockTest(sample), isPublished: true, createdBy: admin._id });
      console.log(`Created: ${sample.title}`);
    }
  } catch (error) {
    console.error(`Failed to seed mock tests: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedMockTests();
