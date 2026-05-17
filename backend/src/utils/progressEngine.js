/**
 * GoalForge Progress Scoring Engine
 * 
 * Supports standard metrics, Speed/TAT (lower-is-better), and Zero-Occurrence formulas.
 */

export function calculateProgress(uomType, target, achievement) {
  const t = parseFloat(target);
  const a = parseFloat(achievement);

  if (isNaN(t) || isNaN(a)) return 0;

  // Zero-occurrence (e.g. 0 downtime, 0 bugs)
  if (uomType === 'zero_occurrence' || t === 0) {
    return a === 0 ? 100 : 0;
  }

  // Speed-based / Turnaround Time (TAT) / Lower is better
  if (uomType === 'lower_numeric' || uomType === 'lower_percent') {
    if (a <= t) return 100;
    // Linear regression down to 0% progress if achievement is double the target or worse
    const doubleTarget = t * 2;
    if (a >= doubleTarget) return 0;
    return Math.round(((doubleTarget - a) / t) * 100);
  }

  // Standard Direct Numeric / Percentage (Upper is better)
  if (t === 0) return 0;
  const rawProgress = (a / t) * 100;
  
  // Allow over-achievement up to 150% cap
  return Math.min(150, Math.max(0, Math.round(rawProgress)));
}

export function getCheckinStatus(progress) {
  if (progress >= 90) return 'ON_TRACK';
  if (progress >= 60) return 'NEEDS_IMPROVEMENT';
  return 'AT_RISK';
}
