// "  New   Delhi " -> "new delhi", so small typing differences do not make a short answer wrong
const normalize = (text) => String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();

// Grades an attempt. "submitted" is { questionId: answer }. Missing answers count as skipped.
// There is no negative marking: a wrong or skipped answer gives 0 points.
const gradeAttempt = (test, submitted) => {
  let score = 0;
  let totalPoints = 0;

  const answers = test.questions.map((q) => {
    const answer = String(submitted[String(q._id)] ?? '').trim();
    const isCorrect =
      answer !== '' && (q.type === 'mcq' ? answer === q.correctAnswer : normalize(answer) === normalize(q.correctAnswer));
    const pointsEarned = isCorrect ? q.points : 0;

    score += pointsEarned;
    totalPoints += q.points;

    return {
      questionId: q._id,
      question: q.question,
      type: q.type,
      options: q.options,
      answer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      points: q.points,
      pointsEarned,
    };
  });

  const percentage = totalPoints ? Math.round((score / totalPoints) * 1000) / 10 : 0;
  return { answers, score, totalPoints, percentage };
};

module.exports = { gradeAttempt };
