const MockInterview = require('../models/MockInterview');
const AppError = require('../utils/AppError');
const { getFirstQuestion, getFeedbackAndNextQuestion, getFinalReport } = require('../services/aiService');

const TOTAL_QUESTIONS = 5;
const MAX_INTERVIEWS_PER_DAY = 5; // protects the free AI quota
const MAX_ANSWER_LENGTH = 2000;

const settingsOf = (interview) => ({
  role: interview.role,
  interviewType: interview.interviewType,
  difficulty: interview.difficulty,
  totalQuestions: interview.totalQuestions,
});

// POST /api/interviews   Body: { role, interviewType: 'technical' | 'hr', difficulty: 'easy' | 'medium' | 'hard' }
const startInterview = async (req, res) => {
  const { role, interviewType = 'technical', difficulty = 'medium' } = req.body || {};

  const cleanRole = String(role || '').trim();
  if (!cleanRole) throw new AppError('Please enter the job role you want to practise for', 400);
  if (cleanRole.length > 60) throw new AppError('Role cannot be longer than 60 characters', 400);
  if (!['technical', 'hr'].includes(interviewType)) throw new AppError('Interview type must be technical or hr', 400);
  if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new AppError('Difficulty must be easy, medium or hard', 400);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayCount = await MockInterview.countDocuments({ student: req.user._id, createdAt: { $gte: since } });
  if (todayCount >= MAX_INTERVIEWS_PER_DAY) {
    throw new AppError(`You can start ${MAX_INTERVIEWS_PER_DAY} AI interviews per day. Please try again tomorrow.`, 429);
  }

  const settings = { role: cleanRole, interviewType, difficulty, totalQuestions: TOTAL_QUESTIONS };
  const firstQuestion = await getFirstQuestion(settings); // ask the AI first, so a failure saves nothing

  const interview = await MockInterview.create({
    student: req.user._id,
    ...settings,
    messages: [{ sender: 'interviewer', content: firstQuestion }],
  });

  res.status(201).json({ success: true, interview });
};

// POST /api/interviews/:id/answer   Body: { answer }
const answerQuestion = async (req, res) => {
  const answer = String((req.body && req.body.answer) || '').trim();
  if (!answer) throw new AppError('Please type your answer', 400);
  if (answer.length > MAX_ANSWER_LENGTH) {
    throw new AppError(`Answer cannot be longer than ${MAX_ANSWER_LENGTH} characters`, 400);
  }

  const interview = await MockInterview.findOne({ _id: req.params.id, student: req.user._id });
  if (!interview) throw new AppError('Interview not found', 404);
  if (interview.status === 'completed') throw new AppError('This interview is already finished', 400);

  const last = interview.messages[interview.messages.length - 1];
  if (last.sender !== 'interviewer') throw new AppError('Please wait for the next question', 400);

  // The AI reads the conversation INCLUDING this new answer
  const messages = [...interview.messages.map((m) => m.toObject()), { sender: 'candidate', content: answer }];
  const answeredCount = messages.filter((m) => m.sender === 'candidate').length;

  if (answeredCount < interview.totalQuestions) {
    const { feedback, score, nextQuestion } = await getFeedbackAndNextQuestion(settingsOf(interview), messages, answeredCount + 1);
    interview.messages.push({ sender: 'candidate', content: answer, feedback, score });
    interview.messages.push({ sender: 'interviewer', content: nextQuestion });
  } else {
    const { feedback, score, result } = await getFinalReport(settingsOf(interview), messages);
    interview.messages.push({ sender: 'candidate', content: answer, feedback, score });
    interview.result = result;
    interview.status = 'completed';
  }

  await interview.save();
  res.status(200).json({ success: true, interview });
};

// GET /api/interviews   (my interviews, newest first, without the full conversation)
const getMyInterviews = async (req, res) => {
  const interviews = await MockInterview.find({ student: req.user._id }).select('-messages').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: interviews.length, interviews });
};

// GET /api/interviews/:id
const getInterview = async (req, res) => {
  const interview = await MockInterview.findOne({ _id: req.params.id, student: req.user._id });
  if (!interview) throw new AppError('Interview not found', 404);
  res.status(200).json({ success: true, interview });
};

module.exports = { startInterview, answerQuestion, getMyInterviews, getInterview };
