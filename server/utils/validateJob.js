const AppError = require('./AppError');
const { DEPARTMENTS, JOB_TYPES } = require('../config/constants');

const isEmpty = (value) => value === undefined || value === null || value === '';

// Trims every item, removes empty ones and duplicates (case-insensitive)
const cleanList = (list, label, maxItems) => {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list) || list.some((item) => typeof item !== 'string')) {
    throw new AppError(`${label} must be a list of text values`, 400);
  }
  const seen = new Set();
  const cleaned = list
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (cleaned.length > maxItems) {
    throw new AppError(`${label} can have at most ${maxItems} items`, 400);
  }
  return cleaned;
};

// Checks the job form sent by a recruiter and returns only the allowed fields.
// Fields like status, postedBy and company are never taken from the request body.
const validateJob = (body) => {
  const { title, description, location, type, salary, openings, deadline, requirements } = body || {};
  const eligibility = (body && body.eligibility) || {};

  if (isEmpty(title) || isEmpty(description) || isEmpty(location) || isEmpty(deadline)) {
    throw new AppError('Title, description, location and deadline are required', 400);
  }
  if (!isEmpty(type) && !JOB_TYPES.includes(type)) {
    throw new AppError(`Job type must be one of: ${JOB_TYPES.join(', ')}`, 400);
  }

  // Deadline comes as "YYYY-MM-DD". We treat it as the END of that day in India time,
  // so a job with today's deadline is still open until midnight.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(deadline))) {
    throw new AppError('Deadline must be a date in YYYY-MM-DD format', 400);
  }
  const deadlineDate = new Date(`${deadline}T23:59:59.999+05:30`);
  if (Number.isNaN(deadlineDate.getTime())) {
    throw new AppError('Deadline is not a valid date', 400);
  }
  if (deadlineDate < new Date()) {
    throw new AppError('Deadline must be today or a future date', 400);
  }

  let openingsNumber = 1;
  if (!isEmpty(openings)) {
    openingsNumber = Number(openings);
    if (!Number.isInteger(openingsNumber) || openingsNumber < 1 || openingsNumber > 1000) {
      throw new AppError('Openings must be a whole number between 1 and 1000', 400);
    }
  }

  let minCGPA = 0;
  if (!isEmpty(eligibility.minCGPA)) {
    minCGPA = Number(eligibility.minCGPA);
    if (Number.isNaN(minCGPA) || minCGPA < 0 || minCGPA > 10) {
      throw new AppError('Minimum CGPA must be between 0 and 10', 400);
    }
  }

  let batch;
  if (!isEmpty(eligibility.batch)) {
    batch = Number(eligibility.batch);
    if (!Number.isInteger(batch) || batch < 2000 || batch > 2100) {
      throw new AppError('Batch must be a passing-out year like 2026', 400);
    }
  }

  const branches = cleanList(eligibility.branches, 'Branches', DEPARTMENTS.length);
  const invalidBranch = branches.find((b) => !DEPARTMENTS.includes(b));
  if (invalidBranch) {
    throw new AppError(`"${invalidBranch}" is not a valid branch. Use: ${DEPARTMENTS.join(', ')}`, 400);
  }

  if (!isEmpty(salary) && String(salary).length > 50) {
    throw new AppError('Salary text cannot be longer than 50 characters', 400);
  }

  return {
    title: String(title).trim(),
    description: String(description).trim(),
    location: String(location).trim(),
    type: type || 'Full-time',
    salary: isEmpty(salary) ? undefined : String(salary).trim(),
    openings: openingsNumber,
    deadline: deadlineDate,
    eligibility: {
      minCGPA,
      branches,
      skills: cleanList(eligibility.skills, 'Skills', 20),
      batch,
    },
    requirements: cleanList(requirements, 'Requirements', 20),
  };
};

module.exports = { validateJob };
