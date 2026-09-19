import { COURSES } from '@/lib/sariro-data';
import type { RoomId } from './types';

/**
 * SARIRO — practice: which rooms a learner has
 * ============================================================================
 * The founder, 18 Sep 2026: a practice room for every course, the way Public
 * Speaking has one. The rule is the speaking room's (lib/speaking/access.ts):
 * a room comes with a course the learner is in — active or completed — and
 * every other room is shown locked with the course it comes with, because
 * "this comes with Physics" is worth more than a missing row.
 *
 * A room also knows the learner's GRADE for it, which is what picks the
 * questions: an enrolment's level is `grade-7` for school subjects; a focus
 * course (Algebra, Mechanics…) and coding have no grade, so the profile's
 * grade, or the course's own level, stands in.
 */

export interface RoomDef {
  id: RoomId;
  label: string;
  /** "comes with …" on a locked card. */
  course: string;
  blurb: string;
  accent: string;
  /** Enrolment tracks that open it. */
  tracks: string[];
}

const CODING_TRACKS = [...new Set(COURSES.map((c) => c.trackId))];

export const ROOMS: RoomDef[] = [
  {
    id: 'maths', label: 'Maths', course: 'Maths, Algebra, Trigonometry or Calculus', accent: '#2563EB',
    blurb: 'Endless questions on every topic you have been taught — each one checked the second you answer, with the working shown.',
    tracks: ['mathematics', 'algebra-1', 'algebra-2', 'trigonometry', 'calculus'],
  },
  {
    id: 'coding', label: 'Coding', course: 'any Coding & AI course', accent: '#EA580C',
    blurb: 'The Code Lab: Python, JavaScript and HTML & CSS challenges with real tests, hints and a tutor that helps without giving the answer away.',
    tracks: CODING_TRACKS,
  },
  {
    id: 'physics', label: 'Physics', course: 'Physics or Mechanics', accent: '#7C3AED',
    blurb: 'Numerical problems that care about units — 43.2 km/h is as right as 12 m/s — with the formula to reach for first.',
    tracks: ['physics', 'mechanics'],
  },
  {
    id: 'chemistry', label: 'Chemistry', course: 'Chemistry or Organic Chemistry', accent: '#059669',
    blurb: 'Balance equations, work in moles, and learn the periodic table until it is a map.',
    tracks: ['chemistry', 'organic-chemistry'],
  },
  {
    id: 'biology', label: 'Biology', course: 'Biology', accent: '#16A34A',
    blurb: 'Processes in order, living things sorted, and the words that exams expect.',
    tracks: ['biology'],
  },
  {
    id: 'science', label: 'Science', course: 'Science (Grades 1–6)', accent: '#0891B2',
    blurb: 'Predict, then find out — small questions about the world, the way scientists ask them.',
    tracks: ['science'],
  },
  {
    id: 'english', label: 'English', course: 'English', accent: '#DB2777',
    blurb: 'Grammar and vocabulary drills that come back when you get them wrong.',
    tracks: ['english'],
  },
];

export interface EnrolmentLike {
  track: string;
  status: string;
  level?: string | null;
  created_at?: string | null;
}

export interface RoomAccess {
  room: RoomDef;
  allowed: boolean;
  /** Had it, let it go. */
  lapsed: boolean;
  /** 1–14 for school subjects; for coding, a level index 1–4 (Elementary…Advanced). */
  grade: number | null;
  /** The enrolment's level text: `grade-7`, `Beginner`, `focus`. */
  level: string | null;
  /** The course the room is for, e.g. "Physics · Grade 9". */
  courseName: string | null;
  /** The enrolment's track (`python`, `web-basics`…) — the Code Lab opens on its language. */
  track: string | null;
}

const OPEN = new Set(['active', 'completed']);
const CODING_LEVELS = ['elementary', 'beginner', 'intermediate', 'advanced'];

/** Suitable grade for a focus course with no grade of its own. */
const FOCUS_GRADE: Record<string, number> = {
  'algebra-1': 8, 'algebra-2': 10, trigonometry: 10, calculus: 11, mechanics: 10, 'organic-chemistry': 11,
};

export function roomsFor(enrolments: readonly EnrolmentLike[] | null | undefined, profileGrade: number | null = null): RoomAccess[] {
  const list = enrolments ?? [];
  return ROOMS.map((room) => {
    const mine = list
      .filter((e) => room.tracks.includes(e.track))
      .sort((a, b) => Date.parse(b.created_at ?? '0') - Date.parse(a.created_at ?? '0'));
    const open = mine.find((e) => OPEN.has(e.status));
    if (!open) return { room, allowed: false, lapsed: mine.length > 0, grade: null, level: null, courseName: null, track: null };

    const level = (open.level ?? '').toLowerCase();
    let grade: number | null = null;
    let courseName = room.label;
    const g = /^grade-(\d{1,2})$/.exec(level);
    if (g) {
      grade = Number(g[1]);
      courseName = `${room.label} · Grade ${grade}`;
    } else if (room.id === 'coding') {
      const i = CODING_LEVELS.indexOf(level);
      grade = i >= 0 ? i + 1 : 2;
      const course = COURSES.find((c) => c.trackId === open.track && c.level.toLowerCase() === level);
      courseName = course?.title ?? `Coding · ${open.level ?? ''}`.trim();
    } else {
      grade = profileGrade && profileGrade <= 12 ? profileGrade : FOCUS_GRADE[open.track] ?? profileGrade ?? 8;
      courseName = `${room.label} · ${open.track.replace(/-/g, ' ')}`;
    }
    return { room, allowed: true, lapsed: false, grade, level: open.level ?? null, courseName, track: open.track };
  });
}

export const roomById = (id: string): RoomDef | null => ROOMS.find((r) => r.id === id) ?? null;

/** Whether any subject room (not Public Speaking's) is open to this learner. */
export function hasPracticeRoom(enrolments: readonly EnrolmentLike[] | null | undefined): boolean {
  return roomsFor(enrolments).some((r) => r.allowed);
}
