// Checks if a student meets a job's eligibility rules (CGPA, branch, batch).
// Used when listing jobs (to show "Eligible" / "Not eligible") and again in Phase 6 when applying,
// so the rule is written only once.
const checkEligibility = (studentProfile, job) => {
  const profile = studentProfile || {};
  const rules = job.eligibility || {};
  const reasons = [];

  if (rules.minCGPA > 0) {
    if (profile.cgpa === undefined || profile.cgpa === null) {
      reasons.push(`Minimum CGPA is ${rules.minCGPA}. Add your CGPA to your profile.`);
    } else if (profile.cgpa < rules.minCGPA) {
      reasons.push(`Minimum CGPA is ${rules.minCGPA} (yours is ${profile.cgpa}).`);
    }
  }

  if (rules.branches && rules.branches.length > 0 && !rules.branches.includes(profile.department)) {
    reasons.push(
      profile.department
        ? `Open only to ${rules.branches.join(', ')} (yours is ${profile.department}).`
        : `Open only to ${rules.branches.join(', ')}. Add your department to your profile.`
    );
  }

  if (rules.batch && profile.batch !== rules.batch) {
    reasons.push(
      profile.batch
        ? `Open only to the ${rules.batch} batch (yours is ${profile.batch}).`
        : `Open only to the ${rules.batch} batch. Add your batch to your profile.`
    );
  }

  return { isEligible: reasons.length === 0, reasons };
};

module.exports = { checkEligibility };
