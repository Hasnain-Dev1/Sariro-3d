import { buildGradeSyllabus } from '@/lib/school/curriculum';
import { checkAnswer, type Response } from '../check';
import { hashSeed } from '../rng';
import type { Difficulty, Item, Topic } from '../types';
import { MATHS_TOPICS, gradeTopics, matchTopics, mathsTopicsFor } from './topics';

/**
 * SARIRO — maths test sheets and lesson quizzes
 * ============================================================================
 * The founder, 18 Sep 2026: "a timer based test for each module — each module
 * should have 10 test sheets, auto verify the sheet and its answers, generate a
 * score from the final answer the kid gives, and an auto report for the kid";
 * and "at the end of each lesson students attempt a 10 min quiz to verify
 * their learning".
 *
 * A SHEET is fixed: sheet 4 of Grade 7 Module 3 is the same fifteen questions
 * for every child, forever — its seeds come from its name, not from chance —
 * so a teacher can talk about question 6 and a retake is a real retake.
 * Sheets 1–3 are foundation, 4–7 standard, 8–10 challenge.
 *
 * Unlike practice, a test says nothing until it is handed in. Then every
 * answer is marked on the device, and the report says where the marks went.
 */

export const SHEETS_PER_MODULE = 10;
export const SHEET_QUESTIONS = 15;
export const SHEET_MINUTES = 30;
export const QUIZ_QUESTIONS = 8;
export const QUIZ_MINUTES = 10;

export interface TestPaper {
  /** `maths:sheet:g7:m3:s4` or `maths:quiz:g7:m3:l2` — logged as the attempt's topic. */
  id: string;
  title: string;
  minutes: number;
  items: Item[];
  difficulty: Difficulty;
}

export interface ModuleInfo {
  num: number;
  title: string;
  lessons: string[];
  topics: Topic[];
}

/** The topics a module teaches: its title and all its lesson titles, matched to generators. */
export function moduleTopics(grade: number, moduleNum: number): ModuleInfo {
  const syllabus = buildGradeSyllabus('mathematics', grade);
  const mod = syllabus.modules[moduleNum - 1];
  const lessons = mod ? mod.lessons.filter((l) => l.kind === 'lesson').map((l) => l.title) : [];
  const title = mod?.title ?? `Module ${moduleNum}`;
  const topics = mathsTopicsFor(grade, title, lessons.join(' '));
  return { num: moduleNum, title, lessons, topics };
}

export function modulesFor(grade: number): ModuleInfo[] {
  return buildGradeSyllabus('mathematics', grade).modules.map((m) => moduleTopics(grade, m.num));
}

export const sheetDifficulty = (sheet: number): Difficulty => (sheet <= 3 ? 1 : sheet <= 7 ? 2 : 3);

/**
 * Deal `count` questions across `topics` round-robin (so every topic is
 * tested), seeded by `name`. A module whose topics cannot fill a paper with
 * different questions is topped up from the rest of its grade.
 */
function deal(topics: Topic[], count: number, name: string, difficulty: Difficulty, grade: number): Item[] {
  const items: Item[] = [];
  const seen = new Set<string>();
  const fill = (pool: Topic[], tag: string) => {
    for (let i = 0; items.length < count && i < count * 6 && pool.length; i++) {
      const topic = pool[i % pool.length];
      const item = topic.make(hashSeed(`${name}${tag}#${i}`), difficulty);
      // No two identical questions on one paper.
      if (seen.has(item.prompt)) continue;
      seen.add(item.prompt);
      items.push(item);
    }
  };
  fill(topics.length ? topics : gradeTopics(grade), '');
  if (items.length < count) fill(gradeTopics(grade).filter((t) => !topics.includes(t)), ':extra');
  if (items.length < count) fill(MATHS_TOPICS, ':any');
  return items;
}

export function sheetFor(grade: number, moduleNum: number, sheet: number): TestPaper {
  const mod = moduleTopics(grade, moduleNum);
  const difficulty = sheetDifficulty(sheet);
  const id = `maths:sheet:g${grade}:m${moduleNum}:s${sheet}`;
  return {
    id,
    title: `${mod.title} · Test sheet ${sheet}`,
    minutes: SHEET_MINUTES,
    difficulty,
    items: deal(mod.topics, SHEET_QUESTIONS, id, difficulty, grade),
  };
}

/** A quiz on one lesson. `attempt` makes a retake a fresh paper on the same lesson. */
export function lessonQuizFor(grade: number, moduleNum: number, lessonTitle: string, attempt = 1): TestPaper {
  const mod = moduleTopics(grade, moduleNum);
  // The lesson's own words first; the module's when the lesson's match nothing.
  const byLesson = matchTopics(grade, lessonTitle);
  const topics = byLesson.length ? byLesson : mod.topics;
  const lessonIndex = Math.max(0, mod.lessons.indexOf(lessonTitle));
  const id = `maths:quiz:g${grade}:m${moduleNum}:l${lessonIndex + 1}`;
  return {
    id,
    title: `Quiz · ${lessonTitle}`,
    minutes: QUIZ_MINUTES,
    difficulty: 2,
    items: deal(topics, QUIZ_QUESTIONS, `${id}#${attempt}`, 2, grade),
  };
}

/* ── Marking and the report ─────────────────────────────────────────────── */

export interface Marked {
  index: number;
  topic: string;
  correct: boolean;
  /** Answered at all. */
  answered: boolean;
  /** Seconds spent on it, when known. */
  seconds: number | null;
}

export interface TopicLine {
  topic: string;
  title: string;
  correct: number;
  total: number;
}

export interface TestReport {
  paperId: string;
  score: number;
  correct: number;
  total: number;
  unanswered: number;
  secondsUsed: number;
  minutes: number;
  finishedInTime: boolean;
  byTopic: TopicLine[];
  strengths: string[];
  toWorkOn: string[];
  /** The one-line verdict at the top. */
  headline: string;
  /** What to do next, most useful first. */
  advice: string[];
  marked: Marked[];
}

const topicTitle = (key: string) => MATHS_TOPICS.find((t) => t.key === key)?.title ?? key;

export function markPaper(
  paper: TestPaper,
  responses: (Response | null)[],
  secondsUsed: number,
  perQuestionSeconds: (number | null)[] = []
): TestReport {
  const marked: Marked[] = paper.items.map((item, index) => {
    const r = responses[index];
    const answered = !!r;
    const correct = answered ? checkAnswer(item.answer, r!).correct : false;
    return { index, topic: item.topic, correct, answered, seconds: perQuestionSeconds[index] ?? null };
  });
  const total = marked.length;
  const correct = marked.filter((m) => m.correct).length;
  const unanswered = marked.filter((m) => !m.answered).length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  const lines = new Map<string, TopicLine>();
  for (const m of marked) {
    const line = lines.get(m.topic) ?? { topic: m.topic, title: topicTitle(m.topic), correct: 0, total: 0 };
    line.total += 1;
    if (m.correct) line.correct += 1;
    lines.set(m.topic, line);
  }
  const byTopic = [...lines.values()].sort((a, b) => a.correct / a.total - b.correct / b.total);
  const strengths = byTopic.filter((l) => l.correct === l.total).map((l) => l.title);
  const toWorkOn = byTopic.filter((l) => l.correct / l.total < 0.6).map((l) => l.title);

  const finishedInTime = secondsUsed <= paper.minutes * 60;
  const headline =
    score >= 90 ? 'Outstanding — this module is yours.'
    : score >= 75 ? 'Strong result. A little polishing and it is secure.'
    : score >= 50 ? 'Getting there. The report shows exactly where the marks went.'
    : 'This module needs more practice — start with the topics below.';

  const advice: string[] = [];
  if (toWorkOn.length) advice.push(`Practise ${toWorkOn.slice(0, 2).join(' and ')} in the practice room, then try the next sheet.`);
  if (unanswered > 0) advice.push(`${unanswered} question${unanswered === 1 ? ' was' : 's were'} left blank — an attempt can still earn the mark.`);
  if (!finishedInTime) advice.push('You ran out of time: practise the quick topics until they are automatic.');
  else if (secondsUsed < paper.minutes * 60 * 0.3 && score < 75) advice.push('You finished very fast — slowing down and checking would win marks.');
  if (score >= 90) advice.push('Move up to a harder sheet in this module.');
  if (!advice.length) advice.push('Try the next sheet in this module.');

  return {
    paperId: paper.id, score, correct, total, unanswered, secondsUsed, minutes: paper.minutes, finishedInTime,
    byTopic, strengths, toWorkOn, headline, advice, marked,
  };
}
