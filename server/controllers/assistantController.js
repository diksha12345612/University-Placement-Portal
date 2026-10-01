const Job = require('../models/Job');
const Application = require('../models/Application');
const MockTestAttempt = require('../models/MockTestAttempt');
const AppError = require('../utils/AppError');
const { checkEligibility } = require('../utils/eligibility');
const { checkRateLimit } = require('../utils/rateLimit');
const { chatWithAssistant, generateInterviewPrep } = require('../services/aiService');

const HOUR = 60 * 60 * 1000;
const MAX_MESSAGES_SENT_TO_AI = 12; // older messages are dropped to keep requests small
const PREP_CACHE_HOURS = 24;

// Collects this student's own data as short text for the AI ("retrieval" step of RAG)
const buildStudentContext = async (user) => {
  const p = user.studentProfile || {};

  const [applications, attempts, openJobs] = await Promise.all([
    Application.find({ student: user._id }).populate('job', 'title company').sort({ createdAt: -1 }).limit(10),
    MockTestAttempt.find({ student: user._id, status: 'completed' })
      .populate('test', 'title category')
      .sort({ completedAt: -1 })
      .limit(5),
    Job.find({ status: 'approved', isActive: true, deadline: { $gte: new Date() } }).select('title company type eligibility'),
  ]);

  const eligibleJobs = openJobs.filter((job) => checkEligibility(p, job).isEligible);
  const analysis = p.aiResumeAnalysis;

  return [
    `Name: ${user.name}`,
    `Department: ${p.department || 'not set'}, Batch: ${p.batch || 'not set'}, CGPA: ${p.cgpa ?? 'not set'}`,
    `10th: ${p.tenthPercentage ?? '-'}%, 12th: ${p.twelfthPercentage ?? '-'}%`,
    `Skills: ${(p.skills || []).join(', ') || 'none added'}`,
    `Projects: ${(p.projects || []).map((pr) => pr.title).join(', ') || 'none added'}`,
    `Experience: ${(p.experience || []).map((e) => `${e.role} at ${e.company}`).join(', ') || 'none added'}`,
    `Resume uploaded: ${p.resumePublicId ? 'yes' : 'no'}`,
    analysis?.score != null
      ? `AI resume score: ${analysis.score}/100. Weaknesses: ${(analysis.weaknesses || []).join('; ')}. Missing skills: ${(analysis.missingSkills || []).join(', ')}`
      : 'AI resume score: not analysed yet',
    `Placed: ${p.isPlaced ? `yes, at ${p.placedAt}` : 'no'}`,
    `Applications: ${applications.map((a) => `${a.job?.title} at ${a.job?.company} (${a.status})`).join('; ') || 'none yet'}`,
    `Recent mock tests: ${attempts.map((a) => `${a.test?.title || 'deleted test'} ${a.percentage}%`).join('; ') || 'none taken'}`,
    `Open jobs: ${openJobs.length}, eligible for ${eligibleJobs.length}: ${eligibleJobs.slice(0, 8).map((j) => `${j.title} at ${j.company}`).join('; ') || 'none'}`,
  ].join('\n');
};

// POST /api/assistant/chat
// Body: { messages: [{ role: 'user' | 'assistant', content }] }  (the chat is kept in the browser)
const chat = async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
    throw new AppError('messages must be a list of 1 to 40 chat messages', 400);
  }
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim()) {
      throw new AppError('Each message needs a role (user or assistant) and some text', 400);
    }
    if (m.content.length > 2000) throw new AppError('A message cannot be longer than 2000 characters', 400);
  }
  if (messages[messages.length - 1].role !== 'user') {
    throw new AppError('The last message must be from you', 400);
  }

  checkRateLimit(`chat:${req.user._id}`, 30, HOUR, 'You have sent a lot of messages. Please take a short break and try again later.');

  const context = await buildStudentContext(req.user);
  const reply = await chatWithAssistant(context, messages.slice(-MAX_MESSAGES_SENT_TO_AI));

  res.status(200).json({ success: true, reply });
};

// Same role + type for 24 hours = same sheet, so the AI is not asked again and again
const prepCache = new Map();

// POST /api/assistant/interview-prep   Body: { role, type: 'technical' | 'behavioral' | 'hr' }
const interviewPrep = async (req, res) => {
  const { role, type = 'technical' } = req.body || {};
  const cleanRole = String(role || '').trim();

  if (!cleanRole) throw new AppError('Please choose a role', 400);
  if (cleanRole.length > 60) throw new AppError('Role cannot be longer than 60 characters', 400);
  if (!['technical', 'behavioral', 'hr'].includes(type)) {
    throw new AppError('Type must be technical, behavioral or hr', 400);
  }

  const key = `${type}:${cleanRole.toLowerCase()}`;
  const cached = prepCache.get(key);
  if (cached && Date.now() - cached.createdAt < PREP_CACHE_HOURS * HOUR) {
    return res.status(200).json({ success: true, prep: cached.prep, cached: true });
  }

  checkRateLimit(`prep:${req.user._id}`, 10, HOUR, 'You have generated many prep sheets. Please try again in a while.');

  const prep = await generateInterviewPrep(cleanRole, type);
  prepCache.set(key, { prep, createdAt: Date.now() });

  res.status(200).json({ success: true, prep, cached: false });
};

module.exports = { chat, interviewPrep };
