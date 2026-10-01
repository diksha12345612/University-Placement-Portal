const Application = require('../models/Application');
const User = require('../models/User');

// A student counts as "placed" when at least one of their applications is "selected".
// We recalculate this after every status change, so it is also undone if a recruiter
// changes "selected" back to something else.
const updatePlacementStatus = async (studentId) => {
  const selected = await Application.findOne({ student: studentId, status: 'selected' })
    .sort({ updatedAt: -1 })
    .populate('job', 'company');

  if (selected) {
    await User.updateOne(
      { _id: studentId },
      { $set: { 'studentProfile.isPlaced': true, 'studentProfile.placedAt': selected.job.company } }
    );
  } else {
    await User.updateOne(
      { _id: studentId },
      { $set: { 'studentProfile.isPlaced': false }, $unset: { 'studentProfile.placedAt': 1 } }
    );
  }
};

module.exports = { updatePlacementStatus };
