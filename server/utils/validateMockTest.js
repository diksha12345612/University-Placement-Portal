const AppError = require('./AppError');
const { TEST_CATEGORIES, QUESTION_TYPES } = require('../config/constants');

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

// Checks the test form sent by the admin and returns clean data
const validateMockTest = (body) => {
  const { title, category, description, duration, questions } = body || {};

  if (isEmpty(title)) throw new AppError('Title is required', 400);
  if (String(title).trim().length > 150) throw new AppError('Title cannot be longer than 150 characters', 400);
  if (!TEST_CATEGORIES.includes(category)) {
    throw new AppError(`Category must be one of: ${TEST_CATEGORIES.join(', ')}`, 400);
  }
  if (!isEmpty(description) && String(description).length > 1000) {
    throw new AppError('Description cannot be longer than 1000 characters', 400);
  }

  const minutes = Number(duration);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    throw new AppError('Duration must be a whole number of minutes between 1 and 180', 400);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError('Add at least one question', 400);
  }
  if (questions.length > 100) throw new AppError('A test can have at most 100 questions', 400);

  const cleanQuestions = questions.map((q, index) => {
    const n = index + 1; // question number for error messages
    if (!q || isEmpty(q.question)) throw new AppError(`Question ${n}: question text is required`, 400);
    if (String(q.question).length > 1000) throw new AppError(`Question ${n}: text is too long`, 400);

    const type = q.type || 'mcq';
    if (!QUESTION_TYPES.includes(type)) throw new AppError(`Question ${n}: type must be mcq or short`, 400);

    const points = isEmpty(q.points) ? 1 : Number(q.points);
    if (!Number.isInteger(points) || points < 1 || points > 10) {
      throw new AppError(`Question ${n}: points must be a whole number from 1 to 10`, 400);
    }

    const correctAnswer = String(q.correctAnswer || '').trim();
    if (!correctAnswer) throw new AppError(`Question ${n}: correct answer is required`, 400);

    let options = [];
    if (type === 'mcq') {
      if (!Array.isArray(q.options)) throw new AppError(`Question ${n}: options must be a list`, 400);
      options = q.options.map((o) => String(o).trim()).filter(Boolean);
      if (options.length < 2 || options.length > 6) {
        throw new AppError(`Question ${n}: add between 2 and 6 options`, 400);
      }
      const lower = options.map((o) => o.toLowerCase());
      if (new Set(lower).size !== lower.length) throw new AppError(`Question ${n}: options must be different`, 400);
      if (!options.includes(correctAnswer)) {
        throw new AppError(`Question ${n}: the correct answer must be one of the options`, 400);
      }
    } else if (correctAnswer.length > 200) {
      throw new AppError(`Question ${n}: short answers can be at most 200 characters`, 400);
    }

    return { question: String(q.question).trim(), type, options, correctAnswer, points };
  });

  return {
    title: String(title).trim(),
    category,
    description: isEmpty(description) ? undefined : String(description).trim(),
    duration: minutes,
    questions: cleanQuestions,
  };
};

module.exports = { validateMockTest };
