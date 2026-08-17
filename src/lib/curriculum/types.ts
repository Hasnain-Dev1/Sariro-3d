/**
 * SARIRO — Structured Curriculum Schema
 * =========================================================
 * App-ready lesson content lives in the codebase as typed data (the same way
 * `sariro-data.ts` holds courses/tracks), NOT as raw HTML blobs. A structured
 * lesson carries the five tabs Sariro lessons are built from:
 *
 *   1. Concept       — 15 min  · teach the core topic (teacher notes + student ref)
 *   2. Mini Project  — 15 min  · a small standalone drill of the concept
 *   3. Final Project — 30 min  · one feature added to the flagship product
 *   4. Quiz          —         · 10 questions, auto-scored
 *   5. Homework      —         · practice + the PREVIOUS lesson's homework hint
 *
 * The tabbed lesson viewer renders a `StructuredLesson` directly. Every field is
 * plain data so the same content can also be exported to HTML, PDF, or printed
 * teacher packs without touching the UI.
 */

/* ── shared ────────────────────────────────────────────────────────────── */

export interface CodeBlock {
  /** Language id for syntax highlighting, e.g. 'tsx' | 'ts' | 'bash' | 'prisma'. */
  language: string;
  /** Optional file this code belongs to, shown as a header, e.g. 'app/layout.tsx'. */
  filename?: string;
  code: string;
  /** Optional one-line caption under the block. */
  caption?: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

/* ── 1. Concept tab (15 min) ───────────────────────────────────────────── */

export interface ConceptSection {
  heading: string;
  /** Markdown-ish prose. Kept as plain text paragraphs joined by blank lines. */
  body: string;
  code?: CodeBlock;
}

export interface ConceptTab {
  durationMin: 15;
  /** One-sentence "what you'll understand by the end". */
  summary: string;
  sections: ConceptSection[];
  keyTerms: KeyTerm[];
  /** Real pitfalls students hit with this topic. */
  commonMistakes: string[];
  /** The 3–5 things that must stick. */
  takeaways: string[];
}

/* ── 2. Mini Project tab (15 min) ──────────────────────────────────────── */

export interface MiniProjectTab {
  durationMin: 15;
  title: string;
  objective: string;
  instructions: string[];
  code: CodeBlock[];
  /** Logical / line-by-line walkthrough of how the code works. */
  explanation: string;
  expectedOutput: string;
  /** Bullet list — what the student now knows how to do. */
  learned: string[];
}

/* ── 3. Final Project tab (30 min) ─────────────────────────────────────── */

export interface FinalProjectTab {
  durationMin: 30;
  /** The Orbit feature/component/improvement this lesson ships. */
  feature: string;
  /** Why Orbit needs it now. */
  why: string;
  /** Where it lives in the project, e.g. 'components/board/TaskCard.tsx'. */
  fileLocation: string;
  code: CodeBlock[];
  /** Exactly where to put / how to modify the code. */
  placement: string;
  /** Explanation of the implementation. */
  implementation: string;
  expectedResult: string;
  /** How this connects to previous + upcoming lessons (one continuous journey). */
  connects: string;
}

/* ── 4. Quiz tab (10 questions, scored) ────────────────────────────────── */

export type QuizKind =
  | 'concept'      // conceptual understanding
  | 'code_reading' // read code, pick what it does
  | 'output'       // predict the output
  | 'debug'        // find the bug / fix
  | 'application'  // practical use
  | 'project';     // Orbit / final-project understanding

export interface QuizQuestion {
  id: string;
  kind: QuizKind;
  prompt: string;
  /** Optional snippet the question refers to. */
  code?: CodeBlock;
  options: string[];
  /** Index into `options` of the correct answer. */
  answerIndex: number;
  /** Shown after answering — why it's right. */
  explanation: string;
}

/* ── 5. Homework tab (+ previous-lesson hint) ──────────────────────────── */

export interface PrevHomeworkHint {
  /** Which lesson's homework this hint solves (globalNumber of the previous lesson). */
  forLessonNumber: number;
  hint: string;
  steps: string[];
  codeGuidance?: CodeBlock[];
}

export interface HomeworkTab {
  task: string;
  requirements: string[];
  expectedOutcome: string;
  /** Which piece the homework grows. */
  extends: 'mini' | 'final' | 'both' | 'concept';
  /**
   * Hint + implementation approach for the PREVIOUS lesson's homework.
   * Omitted on Lesson 1 (nothing came before).
   */
  previousHomeworkHint?: PrevHomeworkHint;
}

/* ── the lesson ────────────────────────────────────────────────────────── */

export interface StructuredLesson {
  /** Course this belongs to, e.g. 'web-201'. */
  courseId: string;
  /** 1-based module number, matches the course syllabus. */
  moduleNum: number;
  /** 0-based index of the lesson within its module (matches lesson_pages). */
  lessonIndex: number;
  /** 1..30 across the whole course — the "Lesson N" students see. */
  globalNumber: number;
  /** Short lesson name (matches the syllabus entry). */
  name: string;
  /** Full title shown at the top of the lesson. */
  title: string;
  /** One-line hook shown under the title. */
  subtitle: string;
  concept: ConceptTab;
  miniProject: MiniProjectTab;
  finalProject: FinalProjectTab;
  /** Exactly 10 questions. */
  quiz: QuizQuestion[];
  homework: HomeworkTab;
}

/** A whole course's structured curriculum. */
export interface StructuredCourse {
  courseId: string;
  productName: string;   // e.g. 'Orbit'
  lessons: StructuredLesson[];
}
