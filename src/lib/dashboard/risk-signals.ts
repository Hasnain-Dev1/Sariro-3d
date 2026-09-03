/**
 * SARIRO — risk signals
 * =========================================================
 * V2 §62, §64, §66, §67. Pure functions, no I/O.
 *
 * ── These are not predictions, and they do not pretend to be ────────────────
 * §64 asks for churn risk, §66 for teacher performance risk, §67 for a batch
 * health score. The tempting build is a model. The honest build, today, is not:
 * the production database has no completed course history to train on, so a
 * fitted model would be reading noise and dressing it as foresight.
 *
 * So each score here is an explicit, written-down rule over facts that already
 * exist. That has three properties a model would not have yet:
 *
 *   it can be explained  — §93 asks "what data contributed to this
 *                          prediction?", and every score returns its own
 *                          reasons rather than a number from a black box;
 *   it can be argued with — an admin who disagrees can point at the factor;
 *   it fails visibly     — with too little data it says so, instead of
 *                          returning a confident-looking 50.
 *
 * When there is real history, these become the baseline a model has to beat.
 *
 * ── Scores are magnitude, so they get one scale each ────────────────────────
 * Risk is low → high on a single axis. Nothing here returns a category that
 * looks quantitative but is not.
 */

export type RiskBand = 'low' | 'medium' | 'high' | 'unknown';

export interface RiskFactor {
  /** What was looked at. */
  label: string;
  /** The value that was found, already written for a human. */
  detail: string;
  /** How much it pushed the score up. Negative values pull it down. */
  weight: number;
}

export interface RiskAssessment {
  band: RiskBand;
  /** 0-100. Null when there was not enough to judge. */
  score: number | null;
  factors: RiskFactor[];
  /** Said plainly, for the row the person actually reads. */
  summary: string;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function bandFor(score: number): RiskBand {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/* ════════════════════════════════════════════════════════════════════════
   §64 — a learner who may stop coming
   ════════════════════════════════════════════════════════════════════════ */

export interface StudentSignals {
  /** Credits left. One credit is one class. */
  credits: number;
  /** Classes scheduled ahead of them. */
  scheduledAhead: number;
  /** Of the classes that have happened, how many they attended. */
  classesHeld: number;
  classesAttended: number;
  /** Days since they last attended anything. Null when they never have. */
  daysSinceLastClass: number | null;
  /** Lessons completed out of the course total. */
  lessonsCompleted: number;
  lessonsTotal: number;
}

/**
 * The minimum before a judgement is worth making. Below this the honest answer
 * is "we do not know yet", which is more useful than a number somebody might
 * act on.
 */
const MIN_CLASSES_TO_JUDGE = 2;

export function studentChurnRisk(s: StudentSignals): RiskAssessment {
  const factors: RiskFactor[] = [];

  if (s.classesHeld < MIN_CLASSES_TO_JUDGE) {
    return {
      band: 'unknown',
      score: null,
      factors: [{
        label: 'Not enough history',
        detail: `Only ${s.classesHeld} ${s.classesHeld === 1 ? 'class has' : 'classes have'} been held.`,
        weight: 0,
      }],
      summary: 'Too early to say.',
    };
  }

  let score = 0;

  // Credits. The most direct signal there is: nobody attends a class they
  // cannot pay for.
  if (s.credits <= 0) {
    score += 40;
    factors.push({ label: 'Credits', detail: 'Out of credits', weight: 40 });
  } else if (s.credits < 4) {
    score += 22;
    factors.push({ label: 'Credits', detail: `${s.credits} left`, weight: 22 });
  } else {
    factors.push({ label: 'Credits', detail: `${s.credits} left`, weight: 0 });
  }

  // Attendance rate over classes actually held.
  const attendance = s.classesHeld > 0 ? s.classesAttended / s.classesHeld : 1;
  const attendancePct = Math.round(attendance * 100);
  if (attendance < 0.5) {
    score += 30;
    factors.push({ label: 'Attendance', detail: `${attendancePct}% of classes`, weight: 30 });
  } else if (attendance < 0.8) {
    score += 15;
    factors.push({ label: 'Attendance', detail: `${attendancePct}% of classes`, weight: 15 });
  } else {
    factors.push({ label: 'Attendance', detail: `${attendancePct}% of classes`, weight: 0 });
  }

  // Going quiet. Three weeks without a class is a learner drifting away, and
  // it usually shows before the credits run out.
  if (s.daysSinceLastClass === null) {
    score += 20;
    factors.push({ label: 'Last seen', detail: 'Has never attended a class', weight: 20 });
  } else if (s.daysSinceLastClass > 21) {
    score += 25;
    factors.push({ label: 'Last seen', detail: `${s.daysSinceLastClass} days ago`, weight: 25 });
  } else if (s.daysSinceLastClass > 14) {
    score += 12;
    factors.push({ label: 'Last seen', detail: `${s.daysSinceLastClass} days ago`, weight: 12 });
  } else {
    factors.push({ label: 'Last seen', detail: `${s.daysSinceLastClass} days ago`, weight: 0 });
  }

  // Nothing on the calendar. A learner with no next class has nothing pulling
  // them back.
  if (s.scheduledAhead === 0) {
    score += 15;
    factors.push({ label: 'Upcoming classes', detail: 'None scheduled', weight: 15 });
  } else {
    factors.push({ label: 'Upcoming classes', detail: `${s.scheduledAhead} scheduled`, weight: 0 });
  }

  // Progress is the weakest of these, so it moves the score least: a learner
  // can be engaged and slow.
  if (s.lessonsTotal > 0) {
    const pct = Math.round((s.lessonsCompleted / s.lessonsTotal) * 100);
    if (s.lessonsCompleted === 0 && s.classesHeld >= 3) {
      score += 10;
      factors.push({ label: 'Progress', detail: 'No lessons completed yet', weight: 10 });
    } else {
      factors.push({ label: 'Progress', detail: `${pct}% of the course`, weight: 0 });
    }
  }

  score = clamp(score);
  const band = bandFor(score);

  return {
    band,
    score,
    factors,
    summary:
      band === 'high' ? 'Likely to stop without an intervention.'
        : band === 'medium' ? 'Worth a check-in.'
          : 'Engaged.',
  };
}

/* ════════════════════════════════════════════════════════════════════════
   §25, §62, §66 — a teacher whose delivery is slipping
   ════════════════════════════════════════════════════════════════════════ */

export interface TeacherSignals {
  scheduled: number;
  lateJoins: number;
  noShows: number;
  /** Classes finished where attendance was never finalised. */
  attendanceOutstanding: number;
  /** Mean monitoring score out of 10, or null when never observed. */
  monitoringScore: number | null;
}

/** §25, §62 — "Late Join > 5% of scheduled classes" is the stated threshold. */
export const LATE_JOIN_RISK_RATIO = 0.05;

export function teacherRisk(t: TeacherSignals): RiskAssessment {
  if (t.scheduled === 0) {
    return {
      band: 'unknown',
      score: null,
      factors: [{ label: 'No classes', detail: 'Nothing scheduled yet', weight: 0 }],
      summary: 'Nothing to assess yet.',
    };
  }

  const factors: RiskFactor[] = [];
  let score = 0;

  const lateRatio = t.lateJoins / t.scheduled;
  const latePct = Math.round(lateRatio * 1000) / 10;
  if (lateRatio > LATE_JOIN_RISK_RATIO) {
    // Scaled, so 6% and 30% are not the same finding.
    const weight = clamp(Math.round(25 + (lateRatio - LATE_JOIN_RISK_RATIO) * 200), 25, 45);
    score += weight;
    factors.push({ label: 'Late joins', detail: `${t.lateJoins} of ${t.scheduled} (${latePct}%)`, weight });
  } else {
    factors.push({ label: 'Late joins', detail: `${t.lateJoins} of ${t.scheduled} (${latePct}%)`, weight: 0 });
  }

  // A no-show is a class that did not happen for a child who turned up.
  if (t.noShows > 0) {
    const weight = clamp(t.noShows * 20, 20, 40);
    score += weight;
    factors.push({ label: 'No-shows', detail: `${t.noShows}`, weight });
  } else {
    factors.push({ label: 'No-shows', detail: 'None', weight: 0 });
  }

  if (t.attendanceOutstanding > 0) {
    const weight = clamp(t.attendanceOutstanding * 8, 8, 24);
    score += weight;
    factors.push({
      label: 'Attendance not marked',
      detail: `${t.attendanceOutstanding} ${t.attendanceOutstanding === 1 ? 'class' : 'classes'} outstanding`,
      weight,
    });
  }

  if (t.monitoringScore !== null) {
    if (t.monitoringScore < 6) {
      score += 20;
      factors.push({ label: 'Monitoring', detail: `${t.monitoringScore}/10`, weight: 20 });
    } else if (t.monitoringScore >= 8) {
      // Observed teaching well pulls the score down — otherwise a strong
      // teacher with one bad week reads the same as a struggling one.
      score -= 10;
      factors.push({ label: 'Monitoring', detail: `${t.monitoringScore}/10`, weight: -10 });
    } else {
      factors.push({ label: 'Monitoring', detail: `${t.monitoringScore}/10`, weight: 0 });
    }
  } else {
    factors.push({ label: 'Monitoring', detail: 'Never observed', weight: 0 });
  }

  score = clamp(score);
  const band = bandFor(score);

  return {
    band,
    score,
    factors,
    summary:
      band === 'high' ? 'Needs a conversation.'
        : band === 'medium' ? 'Worth watching.'
          : 'Delivering reliably.',
  };
}

/* ════════════════════════════════════════════════════════════════════════
   §67 — batch health
   ════════════════════════════════════════════════════════════════════════ */

export interface BatchSignals {
  studentsEnrolled: number;
  studentsActive: number;
  classesHeld: number;
  classesAttendedTotal: number;
  /** classesHeld × studentsEnrolled, i.e. the attendance that was possible. */
  attendancePossible: number;
  studentsLowOnCredits: number;
  /** The teacher's own assessment, so a batch is not judged apart from them. */
  teacherRiskScore: number | null;
  classesFinalised: number;
}

export interface BatchHealth {
  /** 0-100, higher is healthier. Null when nothing has happened yet. */
  score: number | null;
  /** §67 — "Clicking it should show the components." */
  components: { label: string; score: number; outOf: number; detail: string }[];
  summary: string;
}

/**
 * Health is scored up from zero rather than penalised down from 100, so a
 * brand-new batch does not open at "perfect" and decay. Each component states
 * its own maximum, which is what makes the total explainable.
 */
export function batchHealth(b: BatchSignals): BatchHealth {
  if (b.classesHeld === 0) {
    return {
      score: null,
      components: [],
      summary: 'No classes held yet.',
    };
  }

  const components: BatchHealth['components'] = [];

  // Attendance — 40 points. The single best indicator a batch is alive.
  const attendanceRate = b.attendancePossible > 0 ? b.classesAttendedTotal / b.attendancePossible : 0;
  components.push({
    label: 'Attendance',
    score: Math.round(attendanceRate * 40),
    outOf: 40,
    detail: `${Math.round(attendanceRate * 100)}% of possible attendance`,
  });

  // Retention — 25 points. Enrolled students who are still active.
  const retention = b.studentsEnrolled > 0 ? b.studentsActive / b.studentsEnrolled : 0;
  components.push({
    label: 'Retention',
    score: Math.round(retention * 25),
    outOf: 25,
    detail: `${b.studentsActive} of ${b.studentsEnrolled} still active`,
  });

  // Credits — 15 points. A batch where everyone is about to run out is not
  // healthy however well it is attended today.
  const creditHealth = b.studentsEnrolled > 0
    ? 1 - b.studentsLowOnCredits / b.studentsEnrolled
    : 1;
  components.push({
    label: 'Credits',
    score: Math.round(creditHealth * 15),
    outOf: 15,
    detail: b.studentsLowOnCredits === 0
      ? 'Nobody running low'
      : `${b.studentsLowOnCredits} running low`,
  });

  // Teacher — 10 points, inverted from their risk score.
  const teacherPoints = b.teacherRiskScore === null
    ? 10
    : Math.round((1 - b.teacherRiskScore / 100) * 10);
  components.push({
    label: 'Teacher',
    score: teacherPoints,
    outOf: 10,
    detail: b.teacherRiskScore === null ? 'No concerns recorded' : `Risk score ${b.teacherRiskScore}/100`,
  });

  // Class completion — 10 points. Classes closed properly, with a recording.
  const completion = b.classesHeld > 0 ? b.classesFinalised / b.classesHeld : 0;
  components.push({
    label: 'Classes closed',
    score: Math.round(completion * 10),
    outOf: 10,
    detail: `${b.classesFinalised} of ${b.classesHeld} finalised`,
  });

  const score = clamp(components.reduce((s, c) => s + c.score, 0));

  return {
    score,
    components,
    summary:
      score >= 80 ? 'Healthy.'
        : score >= 60 ? 'Holding, with something to fix.'
          : score >= 40 ? 'Struggling.'
            : 'Needs attention now.',
  };
}

/** The colour a band wears. One hue per band, and the word always beside it. */
export const RISK_TONE: Record<RiskBand, { fg: string; bg: string; label: string }> = {
  high: { fg: '#B91C1C', bg: '#B91C1C14', label: 'High risk' },
  medium: { fg: '#B45309', bg: '#B4530914', label: 'Medium risk' },
  low: { fg: '#15803D', bg: '#15803D14', label: 'Low risk' },
  unknown: { fg: '#64748B', bg: '#64748B14', label: 'Not enough data' },
};
