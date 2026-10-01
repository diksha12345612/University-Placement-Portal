// Fixed list of departments. Students pick from this list and recruiters use the same
// codes for job eligibility, so "CSE" always matches "CSE" (no spelling differences).
// Keep this in sync with client/src/utils/constants.js
const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'Other'];

const JOB_TYPES = ['Full-time', 'Internship', 'Part-time', 'Contract'];

const JOB_STATUSES = ['pending', 'approved', 'rejected'];

// Every application starts as "applied". The recruiter then moves it to one of the others.
const APPLICATION_STATUSES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];
const RECRUITER_SETTABLE_STATUSES = ['shortlisted', 'interview', 'selected', 'rejected'];

const NOTIFICATION_TYPES = ['application', 'job', 'announcement', 'drive', 'system'];

const DRIVE_STATUSES = ['upcoming', 'ongoing', 'completed'];

const TEST_CATEGORIES = ['Aptitude', 'Technical', 'Coding'];
// mcq = pick one option, short = type a short answer (checked ignoring case and extra spaces)
const QUESTION_TYPES = ['mcq', 'short'];
const ANNOUNCEMENT_PRIORITIES = ['low', 'normal', 'high'];
const ANNOUNCEMENT_AUDIENCES = ['all', 'students', 'recruiters'];

module.exports = {
  TEST_CATEGORIES,
  QUESTION_TYPES,
  DRIVE_STATUSES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_AUDIENCES,
  DEPARTMENTS,
  JOB_TYPES,
  JOB_STATUSES,
  APPLICATION_STATUSES,
  RECRUITER_SETTABLE_STATUSES,
  NOTIFICATION_TYPES,
};
