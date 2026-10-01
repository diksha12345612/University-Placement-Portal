const MockTest = require('../models/MockTest');
const MockTestAttempt = require('../models/MockTestAttempt');
const AppError = require('../utils/AppError');
const { validateMockTest } = require('../utils/validateMockTest');
const { gradeAttempt } = require('../services/scoringService');

// Extra seconds allowed after the timer ends, for slow internet when the answers are auto-submitted
const GRACE_SECONDS = 30;

const isTimeOver = (attempt) => Date.now() > attempt.endsAt.getTime() + GRACE_SECONDS * 1000;

// Closes an attempt with no answers (0 marks). Used when time ran out before the student submitted.
const finishAsTimedOut = async (attempt, test) => {
  const result = gradeAttempt(test, {});
  Object.assign(attempt, result, { status: 'completed', completedAt: new Date(), timedOut: true });
  await attempt.save();
};

// Questions for a student: the correct answers are removed
const questionsForStudent = (test) =>
  test.questions.map((q) => ({ _id: q._id, question: q.question, type: q.type, options: q.options, points: q.points }));

/* ---------------- Admin ---------------- */

// GET /api/admin/mock-tests  (all tests with attempt count and average score)
const getAllTests = async (req, res) => {
  const tests = await MockTest.find().sort({ createdAt: -1 });

  const stats = await MockTestAttempt.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$test', attempts: { $sum: 1 }, averagePercentage: { $avg: '$percentage' } } },
  ]);
  const statsByTest = Object.fromEntries(stats.map((s) => [String(s._id), s]));

  res.status(200).json({
    success: true,
    tests: tests.map((t) => {
      const s = statsByTest[String(t._id)];
      return {
        _id: t._id,
        title: t.title,
        category: t.category,
        duration: t.duration,
        isPublished: t.isPublished,
        questionCount: t.questions.length,
        totalPoints: t.questions.reduce((sum, q) => sum + q.points, 0),
        attempts: s ? s.attempts : 0,
        averagePercentage: s ? Math.round(s.averagePercentage * 10) / 10 : null,
        createdAt: t.createdAt,
      };
    }),
  });
};

// GET /api/admin/mock-tests/:id  (full test WITH answers, for editing)
const getTestForAdmin = async (req, res) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) throw new AppError('Test not found', 404);
  res.status(200).json({ success: true, test });
};

// POST /api/admin/mock-tests  (new tests start unpublished, so the admin can check them first)
const createTest = async (req, res) => {
  const test = await MockTest.create({ ...validateMockTest(req.body), createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Test saved as a draft. Publish it when it is ready.', test });
};

// PUT /api/admin/mock-tests/:id
// Old attempts are not affected, because each attempt keeps its own copy of the questions.
const updateTest = async (req, res) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) throw new AppError('Test not found', 404);

  Object.assign(test, validateMockTest(req.body));
  await test.save();
  res.status(200).json({ success: true, message: 'Test updated', test });
};

// PATCH /api/admin/mock-tests/:id/publish  Body: { isPublished: true | false }
const setPublished = async (req, res) => {
  const { isPublished } = req.body || {};
  if (typeof isPublished !== 'boolean') throw new AppError('isPublished must be true or false', 400);

  const test = await MockTest.findById(req.params.id);
  if (!test) throw new AppError('Test not found', 404);

  test.isPublished = isPublished;
  await test.save();
  res.status(200).json({
    success: true,
    message: isPublished ? 'Test published. Students can take it now.' : 'Test hidden from students',
    test,
  });
};

// DELETE /api/admin/mock-tests/:id  (also deletes all attempts of the test)
const deleteTest = async (req, res) => {
  const test = await MockTest.findByIdAndDelete(req.params.id);
  if (!test) throw new AppError('Test not found', 404);

  const { deletedCount } = await MockTestAttempt.deleteMany({ test: test._id });
  res.status(200).json({ success: true, message: `Test deleted with ${deletedCount} attempt(s)` });
};

/* ---------------- Student ---------------- */

// GET /api/mock-tests  (published tests, with this student's best score and attempt count)
const getPublishedTests = async (req, res) => {
  const tests = await MockTest.find({ isPublished: true }).sort({ category: 1, createdAt: -1 });

  const myStats = await MockTestAttempt.aggregate([
    { $match: { student: req.user._id, status: 'completed' } },
    { $group: { _id: '$test', attempts: { $sum: 1 }, bestPercentage: { $max: '$percentage' } } },
  ]);
  const statsByTest = Object.fromEntries(myStats.map((s) => [String(s._id), s]));

  res.status(200).json({
    success: true,
    tests: tests.map((t) => ({
      _id: t._id,
      title: t.title,
      category: t.category,
      description: t.description,
      duration: t.duration,
      questionCount: t.questions.length,
      totalPoints: t.questions.reduce((sum, q) => sum + q.points, 0),
      myAttempts: statsByTest[String(t._id)]?.attempts || 0,
      myBestPercentage: statsByTest[String(t._id)]?.bestPercentage ?? null,
    })),
  });
};

// POST /api/mock-tests/:id/start
// The SERVER decides when the test ends (endsAt), so changing the computer clock or
// refreshing the page does not give extra time. Refreshing resumes the same attempt.
const startTest = async (req, res) => {
  const test = await MockTest.findOne({ _id: req.params.id, isPublished: true });
  if (!test) throw new AppError('Test not found', 404);
  if (test.questions.length === 0) throw new AppError('This test has no questions yet', 400);

  let attempt = await MockTestAttempt.findOne({ student: req.user._id, test: test._id, status: 'in-progress' });

  if (attempt && isTimeOver(attempt)) {
    await finishAsTimedOut(attempt, test); // an old attempt the student never submitted
    attempt = null;
  }

  let resumed = Boolean(attempt);
  if (!attempt) {
    const now = new Date();
    try {
      attempt = await MockTestAttempt.create({
        student: req.user._id,
        test: test._id,
        startedAt: now,
        endsAt: new Date(now.getTime() + test.duration * 60 * 1000),
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      // Another "start" request created the attempt a moment ago: use that one
      attempt = await MockTestAttempt.findOne({ student: req.user._id, test: test._id, status: 'in-progress' });
      resumed = true;
    }
  }

  res.status(resumed ? 200 : 201).json({
    success: true,
    message: resumed ? 'Resuming your unfinished attempt' : 'Test started',
    attemptId: attempt._id,
    endsAt: attempt.endsAt,
    serverTime: new Date(), // lets the browser correct for a wrong computer clock
    test: {
      _id: test._id,
      title: test.title,
      category: test.category,
      duration: test.duration,
      questions: questionsForStudent(test),
    },
  });
};

// POST /api/mock-tests/attempts/:attemptId/submit
// Body: { answers: { "<questionId>": "<chosen option or typed answer>" } }
const submitAttempt = async (req, res) => {
  const { answers = {} } = req.body || {};
  if (typeof answers !== 'object' || Array.isArray(answers) || answers === null) {
    throw new AppError('answers must be an object of { questionId: answer }', 400);
  }
  for (const value of Object.values(answers)) {
    if (typeof value !== 'string' || value.length > 500) {
      throw new AppError('Each answer must be text of at most 500 characters', 400);
    }
  }

  const attempt = await MockTestAttempt.findOne({ _id: req.params.attemptId, student: req.user._id });
  if (!attempt) throw new AppError('Attempt not found', 404);
  if (attempt.status === 'completed') throw new AppError('This attempt has already been submitted', 400);

  const test = await MockTest.findById(attempt.test);
  if (!test) throw new AppError('This test no longer exists', 404);

  if (isTimeOver(attempt)) {
    await finishAsTimedOut(attempt, test);
    throw new AppError('Time was over before the answers were submitted, so this attempt scored 0', 400);
  }

  Object.assign(attempt, gradeAttempt(test, answers), { status: 'completed', completedAt: new Date() });
  await attempt.save();

  res.status(200).json({ success: true, message: 'Test submitted', attempt });
};

// GET /api/mock-tests/attempts/me  (finished attempts, newest first, without the answer details)
const getMyAttempts = async (req, res) => {
  const attempts = await MockTestAttempt.find({ student: req.user._id, status: 'completed' })
    .select('-answers')
    .populate('test', 'title category')
    .sort({ completedAt: -1 });

  res.status(200).json({ success: true, count: attempts.length, attempts });
};

// GET /api/mock-tests/attempts/:attemptId  (one finished attempt with every answer, for review)
const getAttemptResult = async (req, res) => {
  const attempt = await MockTestAttempt.findOne({ _id: req.params.attemptId, student: req.user._id }).populate(
    'test',
    'title category duration'
  );
  if (!attempt) throw new AppError('Attempt not found', 404);
  // Showing answers of an unfinished attempt would let a student see them and then submit
  if (attempt.status !== 'completed') throw new AppError('Finish the test to see the result', 400);

  res.status(200).json({ success: true, attempt });
};

module.exports = {
  getAllTests,
  getTestForAdmin,
  createTest,
  updateTest,
  setPublished,
  deleteTest,
  getPublishedTests,
  startTest,
  submitAttempt,
  getMyAttempts,
  getAttemptResult,
};
