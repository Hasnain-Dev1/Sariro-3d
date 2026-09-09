import {
  summarise, streak, nextFocus, TREND_FLOOR,
  type PracticeAttempt, type PracticeKind, type MetricTrend,
} from '@/lib/speaking/progress';

/**
 * SARIRO — the page a parent decides on
 * ============================================================================
 * Every competitor can print "attended 8 of 8 classes". Attendance is not
 * progress; it is the absence of absence, and a parent who is only ever shown
 * attendance eventually works out that nobody is measuring anything else.
 *
 * This is the other sentence:
 *
 *     "Filler words: 12 a minute down to 3."
 *
 * It is a fact with a date on it, it is about their child specifically, and no
 * school that has not built the measuring underneath can produce it. That is
 * the whole argument for the practice room existing.
 *
 * ── The rule this file exists to enforce ────────────────────────────────────
 * A report that overclaims once is never believed again, and a parent who
 * stops believing the report stops believing the teacher. So:
 *
 *   · no trend under TREND_FLOOR attempts — "too early to tell" is a real
 *     answer and appears often in the first fortnight
 *   · at most ONE thing going the wrong way, ever
 *   · when nothing improved, it says what the child DID — showed up, kept a
 *     streak — rather than manufacturing progress out of noise
 *
 * The last one matters most. Some months a child does not improve, and a
 * report that always finds something to celebrate is a report that means
 * nothing when it celebrates.
 */

export interface ClassRecord {
  /** ISO instant of the class. */
  at: string;
  attended: boolean;
  /** What the teacher wrote about this child, when they wrote anything. */
  remark?: string | null;
  teacherName?: string | null;
}

export interface ReportInput {
  childName: string;
  attempts: PracticeAttempt[];
  classes: ClassRecord[];
  /** Where the window ends. Injectable so the report is testable. */
  now?: number;
  /** How far back to look. */
  days?: number;
}

export interface Movement {
  label: string;
  from: string;
  to: string;
  direction: 'better' | 'worse';
  /** The whole thing as one sentence, for forwarding. */
  sentence: string;
}

export interface ParentReport {
  childName: string;
  periodDays: number;
  /** The one sentence worth putting at the top. Null when nothing is earned. */
  headline: string | null;
  /** What actually moved. Improvements first, at most one decline, max 4. */
  movements: Movement[];
  /** Effort, which is true even in a month where nothing improved. */
  effort: {
    classesAttended: number;
    classesHeld: number;
    practiceDays: number;
    practiceAttempts: number;
    bestStreak: number;
  };
  /** One instruction for the month ahead. */
  focus: { headline: string; advice: string } | null;
  /** The most recent thing a teacher wrote. */
  teacherNote: { text: string; from: string | null; at: string } | null;
  /** Said plainly when the data cannot support a claim yet. */
  tooEarly: boolean;
}

const DAY = 86_400_000;
const KINDS: PracticeKind[] = ['speaking', 'listening', 'writing'];

const fmt = (n: number, unit?: string) => `${n}${unit ?? ''}`;

/**
 * The report.
 *
 * Everything is derived from the same window, so the sentence at the top and
 * the numbers below it can never disagree — which is the way these things
 * usually lose a family's trust.
 */
export function buildParentReport(input: ReportInput): ParentReport {
  const now = input.now ?? Date.now();
  const periodDays = input.days ?? 30;
  const since = now - periodDays * DAY;

  const inWindow = (iso: string) => {
    const t = Date.parse(iso);
    return Number.isFinite(t) && t >= since && t <= now;
  };

  const attempts = (input.attempts ?? []).filter((a) => inWindow(a.createdAt));
  const classes = (input.classes ?? []).filter((c) => inWindow(c.at));

  const summaries = KINDS.map((k) => summarise(attempts, k));
  const run = streak(attempts, now);

  const effort = {
    classesAttended: classes.filter((c) => c.attended).length,
    classesHeld: classes.length,
    practiceDays: run.days,
    practiceAttempts: attempts.length,
    bestStreak: run.best,
  };

  /* ── What moved ──────────────────────────────────────────────────────────
     Only trends that cleared the floor. Improvements first — a parent reads
     the top two lines — then at most one decline, because a list of six
     things a child is bad at is a list read once. */
  const all: MetricTrend[] = summaries.flatMap((s) => s.trends);
  const better = all.filter((t) => t.direction === 'better' && t.first != null && t.latest != null);
  const worse = all.filter((t) => t.direction === 'worse' && t.first != null && t.latest != null);

  const toMovement = (t: MetricTrend): Movement => {
    const u = t.spec.unit ?? '';
    return {
      label: t.spec.label,
      from: fmt(t.first!, u),
      to: fmt(t.latest!, u),
      direction: t.direction === 'better' ? 'better' : 'worse',
      sentence: `${t.spec.label}: ${fmt(t.first!, u)} → ${fmt(t.latest!, u)}`,
    };
  };

  const movements: Movement[] = [
    ...better.slice(0, 3).map(toMovement),
    ...worse.slice(0, 1).map(toMovement),
  ];

  /* ── Is there enough to say anything at all? ─────────────────────────────
     Not "did anything improve" — whether the child has practised enough for a
     claim to mean something. Two attempts is two attempts. */
  const tooEarly = attempts.length < TREND_FLOOR;

  /* ── The headline ────────────────────────────────────────────────────────
     The strongest improvement, or nothing. Deliberately NOT "attended 8 of 8"
     as a fallback: that is the sentence this report exists to be better than,
     and reaching for it the moment the real one is unavailable would teach a
     parent that it was always the real one. */
  let headline: string | null = null;
  if (!tooEarly && better.length > 0) {
    const top = better[0];
    const u = top.spec.unit ?? '';
    headline = `${top.spec.label}: ${fmt(top.first!, u)} down to ${fmt(top.latest!, u)}`;
    if (top.spec.direction === 'up') {
      headline = `${top.spec.label}: ${fmt(top.first!, u)} up to ${fmt(top.latest!, u)}`;
    } else if (top.spec.direction === 'band') {
      headline = `${top.spec.label}: settled at ${fmt(top.latest!, u)}`;
    }
  }

  const focusRaw = tooEarly ? null : nextFocus(summaries);
  const focus = focusRaw ? { headline: focusRaw.headline, advice: focusRaw.advice } : null;

  /* ── The teacher's own words ─────────────────────────────────────────────
     Last, but the part most parents read first. A number is evidence; a
     sentence from the person in the room is the thing they trust. */
  const withRemarks = classes
    .filter((c) => (c.remark ?? '').trim().length > 0)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const teacherNote = withRemarks[0]
    ? {
        text: withRemarks[0].remark!.trim(),
        from: withRemarks[0].teacherName ?? null,
        at: withRemarks[0].at,
      }
    : null;

  return {
    childName: input.childName,
    periodDays,
    headline,
    movements,
    effort,
    focus,
    teacherNote,
    tooEarly,
  };
}

/**
 * The whole report as text, for a WhatsApp message.
 *
 * This is how it will actually travel. A parent does not forward a link to a
 * dashboard behind a login; they forward what is on their screen, to a
 * grandparent or to another parent at the school gate. So it has to survive
 * being pasted with no styling at all.
 */
export function reportAsText(r: ParentReport): string {
  const lines: string[] = [];
  lines.push(`${r.childName} — last ${r.periodDays} days`);
  lines.push('');

  if (r.headline) {
    lines.push(r.headline);
    lines.push('');
  }

  for (const m of r.movements) {
    lines.push(`${m.direction === 'better' ? '↑' : '↓'} ${m.sentence}`);
  }
  if (r.movements.length > 0) lines.push('');

  lines.push(
    `${r.effort.classesAttended} of ${r.effort.classesHeld} classes` +
    `${r.effort.practiceAttempts > 0 ? ` · practised on ${r.effort.practiceDays} days` : ''}`
  );

  if (r.teacherNote) {
    lines.push('');
    lines.push(`"${r.teacherNote.text}"${r.teacherNote.from ? ` — ${r.teacherNote.from}` : ''}`);
  }

  if (r.tooEarly) {
    lines.push('');
    lines.push('Still early — a few more practice sessions and the trends start showing.');
  }

  return lines.join('\n');
}
