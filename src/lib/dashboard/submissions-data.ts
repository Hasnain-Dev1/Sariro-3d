/**
 * SARIRO — Capstone Submissions + Leaderboards data layer
 * =========================================================
 *
 * All Supabase queries for the capstone system:
 *   - Student: fetch lesson notes, fetch/create/update own submissions
 *   - Teacher: fetch submissions for review, submit feedback
 *   - Leaderboard: fetch student + teacher rankings
 *
 * SECURITY:
 *   - All reads use the browser client (RLS-enforced — students see only own,
 *     teachers see only their cohort students', admins see all)
 *   - All writes go through API routes that have CSRF + honeypot + rate-limit
 *   - URL validation: HTTPS + allowlist of trusted domains
 *   - speed_points captured at submit time (immune to booking reschedules)
 *
 * supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues — same pattern as student-data.ts and teacher-data.ts.
 */

import { createClient } from '@/lib/supabase/client';
import {
  getCapstone,
  findEnrichedLessonByName,
  type LessonObject,
  type CapstoneProject,
} from '@/lib/capstones';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';

/* ══════════════════════════════════ Types ══════════════════════════════════ */

export interface ProjectSubmissionRow {
  id: string;
  enrollment_id: string;
  booking_id: string | null;
  user_id: string;
  module_num: number;
  lesson_name: string;
  capstone_step_title: string;
  title: string;
  description: string | null;
  project_url: string;
  demo_url: string | null;
  reflection_tricky: string | null;
  reflection_proud: string | null;
  status: 'submitted' | 'approved' | 'partial' | 'resubmit';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  speed_points: number;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFeedbackRow {
  id: string;
  submission_id: string;
  teacher_id: string;
  rating: number; // 1-5
  content: string;
  approved: boolean;
  review_points: number;
  ontime_bonus: number;
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithFeedback extends ProjectSubmissionRow {
  feedback: SubmissionFeedbackRow | null;
  /** Joined from profiles — student's display name (for teacher view) */
  student_name?: string | null;
  student_avatar?: string | null;
}

export interface StudentLeaderboardRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  enrollment_id: string;
  cohort_id: string | null;
  track: string;
  level: string;
  speed_points: number;
  approval_points: number;
  attendance_points: number;
  total_points: number;
  projects_submitted: number;
  classes_attended: number;
  /** Computed rank — 1-based. Added by fetchStudentLeaderboard(). */
  rank?: number;
}

export interface TeacherLeaderboardRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  classes_points: number;
  review_points: number;
  ontime_bonus: number;
  classes_taught: number;
  projects_reviewed: number;
  ontime_review_rate: number;
  total_points: number;
  /** Computed rank — 1-based. Added by fetchTeacherLeaderboard(). */
  rank?: number;
}

export interface CapstoneProgressRow {
  capstone: CapstoneProject | null;
  total_steps: number;
  completed_steps: number;
  in_progress_steps: number;
  /** Per-lesson status: completed | in_progress | not_started */
  lessons: Array<{
    module_num: string;
    lesson_name: string;
    enriched: LessonObject | null;
    status: 'completed' | 'in_progress' | 'not_started';
    has_submission: boolean;
    submission_status?: 'submitted' | 'approved' | 'partial' | 'resubmit';
  }>;
}

export interface LessonNotesRow {
  /** The session (booking) these notes are tied to */
  booking_id: string;
  slot_start: string;
  slot_end: string;
  teacher_name: string | null;
  /** Lesson identification */
  module_num: number | null;
  lesson_name: string | null;
  /** Enriched lesson data (null for non-enriched courses) */
  enriched: LessonObject | null;
  /** Teacher's notes content (markdown) */
  notes_content: string | null;
  /** Student's submission for this lesson (if any) */
  submission: ProjectSubmissionRow | null;
  /** Feedback on the submission (if any) */
  feedback: SubmissionFeedbackRow | null;
}

/* ══════════════════════════════════ URL Validation ═════════════════════════ */

/**
 * Allowlist of trusted project-hosting domains.
 * Students can only submit URLs from these — blocks phishing + spam.
 * Allowlist (not blocklist) is the only safe approach.
 */
const ALLOWED_PROJECT_HOSTS = new Set<string>([
  'github.com',
  'gist.github.com',
  'replit.com',
  'codepen.io',
  'codesandbox.io',
  'drive.google.com',
  'docs.google.com',
  'colab.research.google.com',
  'scratch.mit.edu',
  'vercel.app',
  'netlify.app',
  'gitlab.com',
  'bitbucket.org',
  'stackblitz.com',
  'jsfiddle.net',
]);

export interface UrlValidationResult {
  ok: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Validate a project URL. Returns {ok: true, normalized} if valid.
 * Rules:
 *   - Must be a parseable URL
 *   - Must use https: (or http: only on localhost)
 *   - Host must be in the allowlist (or a subdomain of an allowlisted host)
 *   - Must have a path longer than "/" (blocks bare domain submissions)
 */
export function validateProjectUrl(raw: string): UrlValidationResult {
  if (!raw || typeof raw !== 'string') {
    return { ok: false, error: 'URL is required' };
  }

  const trimmed = raw.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: 'URL is too short' };
  }
  if (trimmed.length > 2048) {
    return { ok: false, error: 'URL is too long (max 2048 chars)' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  // Allow http only on localhost (dev/preview)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost)) {
    return { ok: false, error: 'URL must use HTTPS' };
  }

  // Check host against allowlist (exact match OR subdomain of allowlisted host)
  const host = url.hostname.toLowerCase();
  const isAllowed =
    ALLOWED_PROJECT_HOSTS.has(host) ||
    [...ALLOWED_PROJECT_HOSTS].some((allowed) => host.endsWith('.' + allowed));

  if (!isAllowed) {
    return {
      ok: false,
      error:
        'URL must be from a trusted host (github.com, replit.com, codepen.io, codesandbox.io, drive.google.com, colab.research.google.com, scratch.mit.edu, vercel.app, netlify.app, gitlab.com, bitbucket.org, stackblitz.com, jsfiddle.net)',
    };
  }

  // Block bare-domain submissions (e.g. "https://github.com" with no path)
  // — forces students to link to a specific repo/file
  if (!url.pathname || url.pathname === '/' || url.pathname.length < 2) {
    return {
      ok: false,
      error: 'Please link to a specific project (not just the homepage)',
    };
  }

  return { ok: true, normalized: url.toString() };
}

/* ══════════════════════════════════ Speed Points ═════════════════════════ */

/**
 * Calculate speed points based on how quickly the student submitted
 * after the class ended.
 *
 *  +25 — within 24h of class end
 *  +18 — within 48h
 *  +10 — within 7 days
 *  +5  — after 7 days (still counts, just lower)
 *
 * If booking is null (no class tied), default to +10 (we don't know when
 * the class was, so give the middle tier).
 */
export function calculateSpeedPoints(
  submittedAt: Date,
  bookingSlotEnd: Date | null
): number {
  if (!bookingSlotEnd) return 10;
  const diffMs = submittedAt.getTime() - bookingSlotEnd.getTime();
  if (diffMs < 0) return 25; // submitted before class ended (early bird)
  const hours = diffMs / (1000 * 60 * 60);
  if (hours <= 24) return 25;
  if (hours <= 48) return 18;
  if (hours <= 24 * 7) return 10;
  return 5;
}

/* ══════════════════════════════════ Reads ═════════════════════════════════ */

/**
 * Fetch all submissions for the current user (student's own view).
 * Newest first. RLS enforces user_id = auth.uid().
 */
export async function fetchMySubmissions(): Promise<ProjectSubmissionRow[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as ProjectSubmissionRow[];
  } catch (err) {
    console.warn('[submissions] fetchMySubmissions error:', err);
    return [];
  }
}

/**
 * Fetch a single submission by ID.
 * RLS ensures only the owner (student) OR the cohort teacher OR an admin can see it.
 */
export async function fetchSubmission(
  submissionId: string
): Promise<SubmissionWithFeedback | null> {
  if (!submissionId) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const submission = data as ProjectSubmissionRow;

    // Fetch feedback (1:1, may not exist yet)
    const { data: feedbackData } = await supabase
      .from('submission_feedback')
      .select('*')
      .eq('submission_id', submissionId)
      .maybeSingle();

    return {
      ...submission,
      feedback: (feedbackData as SubmissionFeedbackRow) ?? null,
    };
  } catch (err) {
    console.warn('[submissions] fetchSubmission error:', err);
    return null;
  }
}

/**
 * Fetch the student's submission for a specific lesson (by enrollment + module).
 * Used by the submission page to pre-fill the form if a submission exists.
 */
export async function fetchSubmissionForLesson(
  enrollmentId: string,
  moduleNum: number
): Promise<SubmissionWithFeedback | null> {
  if (!enrollmentId || !moduleNum) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('module_num', moduleNum)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const submission = data as ProjectSubmissionRow;

    const { data: feedbackData } = await supabase
      .from('submission_feedback')
      .select('*')
      .eq('submission_id', submission.id)
      .maybeSingle();

    return {
      ...submission,
      feedback: (feedbackData as SubmissionFeedbackRow) ?? null,
    };
  } catch (err) {
    console.warn('[submissions] fetchSubmissionForLesson error:', err);
    return null;
  }
}

/**
 * Fetch all submissions for a specific booking (teacher's review view).
 * RLS ensures only the cohort teacher or admin can call this successfully.
 * Returns submissions + student names + feedback in one round-trip.
 */
export async function fetchSubmissionsForBooking(
  bookingId: string
): Promise<SubmissionWithFeedback[]> {
  if (!bookingId) return [];
  try {
    const supabase = createClient();
    const { data: submissions, error } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('booking_id', bookingId)
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    if (!submissions || submissions.length === 0) return [];

    // Fetch student profiles in one query (avoid N+1)
    const studentIds = [...new Set(submissions.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', studentIds);
    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, p])
    );

    // Fetch feedback for these submissions in one query
    const submissionIds = submissions.map((s) => s.id);
    const { data: feedbackRows } = await supabase
      .from('submission_feedback')
      .select('*')
      .in('submission_id', submissionIds);
    const feedbackMap = new Map(
      (feedbackRows ?? []).map((f) => [f.submission_id as string, f])
    );

    return submissions.map((s) => {
      const profile = profileMap.get(s.user_id);
      return {
        ...(s as ProjectSubmissionRow),
        student_name: profile?.full_name ?? null,
        student_avatar: profile?.avatar_url ?? null,
        feedback:
          (feedbackMap.get(s.id) as SubmissionFeedbackRow | undefined) ?? null,
      };
    });
  } catch (err) {
    console.warn('[submissions] fetchSubmissionsForBooking error:', err);
    return [];
  }
}

/**
 * Fetch every submission that still needs review across ALL of the signed-in
 * teacher's bookings — powers the dedicated "Project Reviews" surface, so new
 * submissions are visible without opening each class. RLS
 * (teachers_read_cohort_submissions) already scopes rows to the teacher's own
 * bookings; we additionally filter to status='submitted' (not yet reviewed).
 */
export async function fetchPendingSubmissionsForTeacher(): Promise<SubmissionWithFeedback[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // The teacher's bookings (RLS also enforces this, but scoping the query
    // keeps it cheap).
    const { data: bookings } = await supabase.from('bookings').select('id').eq('teacher_id', user.id);
    const bookingIds = (bookings ?? []).map((b) => b.id);
    if (bookingIds.length === 0) return [];

    const { data: submissions, error } = await supabase
      .from('project_submissions')
      .select('*')
      .in('booking_id', bookingIds)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true });
    if (error) throw error;
    if (!submissions || submissions.length === 0) return [];

    const studentIds = [...new Set(submissions.map((s) => s.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', studentIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    const submissionIds = submissions.map((s) => s.id);
    const { data: feedbackRows } = await supabase.from('submission_feedback').select('*').in('submission_id', submissionIds);
    const feedbackMap = new Map((feedbackRows ?? []).map((f) => [f.submission_id as string, f]));

    return submissions.map((s) => {
      const profile = profileMap.get(s.user_id);
      return {
        ...(s as ProjectSubmissionRow),
        student_name: profile?.full_name ?? null,
        student_avatar: profile?.avatar_url ?? null,
        feedback: (feedbackMap.get(s.id) as SubmissionFeedbackRow | undefined) ?? null,
      };
    });
  } catch (err) {
    console.warn('[submissions] fetchPendingSubmissionsForTeacher error:', err);
    return [];
  }
}

/**
 * Fetch lesson notes for the current student — the "after class" view.
 * Returns a timeline of past sessions with:
 *   - Lesson identification (module + name)
 *   - Enriched lesson data (topic, objectives, capstone step)
 *   - Teacher's notes content
 *   - Student's submission + feedback (if any)
 *
 * Newest session first.
 */
export async function fetchLessonNotes(): Promise<LessonNotesRow[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Find all the student's active enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, track, level, cohort_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'completed']);
    if (!enrollments || enrollments.length === 0) return [];

    const cohortIds = enrollments
      .map((e) => e.cohort_id)
      .filter(Boolean) as string[];
    if (cohortIds.length === 0) return [];

    // 2. Fetch past bookings for these cohorts (status = completed)
    const { data: bookings, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, cohort_id, teacher_id, slot_start, slot_end, module_num, lesson_name, status')
      .in('cohort_id', cohortIds)
      .in('status', ['completed', 'scheduled'])  // include upcoming for preview
      .order('slot_start', { ascending: false });
    if (bookingErr) throw bookingErr;
    if (!bookings || bookings.length === 0) return [];

    // 3. Fetch teacher profiles in one query
    const teacherIds = [...new Set(bookings.map((b) => b.teacher_id).filter(Boolean))];
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds);
    const teacherMap = new Map((teachers ?? []).map((t) => [t.id as string, t]));

    // 4. Fetch session notes for these bookings (teacher-scoped — one note per booking+teacher)
    const bookingIds = bookings.map((b) => b.id);
    const { data: notesRows } = await supabase
      .from('session_notes')
      .select('booking_id, content')
      .in('booking_id', bookingIds);
    const notesMap = new Map(
      (notesRows ?? []).map((n) => [n.booking_id as string, n.content as string])
    );

    // 5. Fetch student's submissions for these bookings
    const { data: submissions } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('user_id', user.id)
      .in('booking_id', bookingIds);
    const submissionMap = new Map(
      (submissions ?? []).map((s) => [s.booking_id as string, s as ProjectSubmissionRow])
    );

    // 6. Fetch feedback for these submissions (if any)
    const submissionIds = (submissions ?? []).map((s) => s.id);
    let feedbackMap = new Map<string, SubmissionFeedbackRow>();
    if (submissionIds.length > 0) {
      const { data: feedbackRows } = await supabase
        .from('submission_feedback')
        .select('*')
        .in('submission_id', submissionIds);
      feedbackMap = new Map(
        (feedbackRows ?? []).map((f) => [f.submission_id as string, f as SubmissionFeedbackRow])
      );
    }

    // 7. Build enrollment lookup for courseId → capstones lookup
    const enrollmentMap = new Map(enrollments.map((e) => [e.id, e]));

    // 8. Assemble the timeline
    return bookings.map((b) => {
      const enrollment = enrollmentMap.get(
        // Find enrollment matching this booking's cohort
        enrollments.find((e) => e.cohort_id === b.cohort_id)?.id ?? ''
      );
      const courseId = enrollment ? `${enrollment.track}-${enrollment.level.toLowerCase()}` : '';
      const enriched = b.module_num && b.lesson_name
        ? findEnrichedLessonByName(courseId, String(b.module_num).padStart(2, '0'), b.lesson_name)
        : null;
      const submission = submissionMap.get(b.id) ?? null;
      const feedback = submission
        ? feedbackMap.get(submission.id) ?? null
        : null;

      return {
        booking_id: b.id,
        slot_start: b.slot_start,
        slot_end: b.slot_end,
        teacher_name: teacherMap.get(b.teacher_id)?.full_name ?? null,
        module_num: b.module_num ?? null,
        lesson_name: b.lesson_name ?? null,
        enriched,
        notes_content: notesMap.get(b.id) ?? null,
        submission,
        feedback,
      };
    });
  } catch (err) {
    console.warn('[submissions] fetchLessonNotes error:', err);
    return [];
  }
}

/**
 * Fetch the student's capstone progress for a specific enrollment.
 * Returns the capstone definition + per-lesson status (completed/in_progress/not_started).
 * Used by the "My Capstone Project" section on the student dashboard.
 */
export async function fetchCapstoneProgress(
  enrollmentId: string,
  track: string,
  level: string
): Promise<CapstoneProgressRow | null> {
  if (!enrollmentId || !track || !level) return null;
  try {
    // 1. Get capstone definition (static data, no DB call)
    const courseId = `${track}-${level.toLowerCase()}`;
    const capstone = getCapstone(courseId);

    // 2. Get syllabus (so we know total lessons + names)
    const syllabus = getCourseSyllabus(track, level);
    if (!syllabus || syllabus.totalLessons === 0) {
      return {
        capstone,
        total_steps: 0,
        completed_steps: 0,
        in_progress_steps: 0,
        lessons: [],
      };
    }

    // 3. Get student's submissions for this enrollment
    const supabase = createClient();
    const { data: submissions } = await supabase
      .from('project_submissions')
      .select('id, module_num, lesson_name, status')
      .eq('enrollment_id', enrollmentId);
    const submissionByModule = new Map<number, { status: string; has_submission: true }>(
      (submissions ?? []).map((s) => [s.module_num as number, { status: s.status as string, has_submission: true as const }])
    );

    // 4. Get lesson_progress for this enrollment (for completed lessons)
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('module_num, lesson_name, capstone_completed')
      .eq('enrollment_id', enrollmentId);
    const completedKeys = new Set(
      (progress ?? []).filter((p) => p.capstone_completed).map((p) => `${p.module_num}::${p.lesson_name}`)
    );

    // 5. Build per-lesson status
    let moduleCounter = 0;
    const lessons = syllabus.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => {
        const lessonNameStr = typeof lesson === 'string' ? lesson : lesson.name;
        moduleCounter += 1;
        const submission = submissionByModule.get(moduleCounter);
        const isCapstoneComplete = completedKeys.has(`${mod.num}::${lessonNameStr}`);

        let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
        if (isCapstoneComplete || submission?.status === 'approved') {
          status = 'completed';
        } else if (submission) {
          status = 'in_progress';
        }

        return {
          module_num: mod.num,
          lesson_name: lessonNameStr,
          enriched: findEnrichedLessonByName(courseId, mod.num, lessonNameStr),
          status,
          has_submission: !!submission,
          submission_status: submission?.status as
            | 'submitted'
            | 'approved'
            | 'partial'
            | 'resubmit'
            | undefined,
        };
      })
    );

    const completed_steps = lessons.filter((l) => l.status === 'completed').length;
    const in_progress_steps = lessons.filter((l) => l.status === 'in_progress').length;

    return {
      capstone,
      total_steps: syllabus.totalLessons,
      completed_steps,
      in_progress_steps,
      lessons,
    };
  } catch (err) {
    console.warn('[submissions] fetchCapstoneProgress error:', err);
    return null;
  }
}

/* ══════════════════════════════════ Leaderboards ═════════════════════════ */

/**
 * Fetch the student leaderboard.
 * Reads from the live `student_leaderboard` view (no caching — points are live).
 *
 * @param scope 'cohort' (default) | 'track_level' | 'global'
 * @param limit Max rows to return (default 50)
 * @param cohortId Required when scope='cohort'
 * @param track + level Required when scope='track_level'
 */
export async function fetchStudentLeaderboard(params: {
  scope?: 'cohort' | 'track_level' | 'global';
  limit?: number;
  cohortId?: string;
  track?: string;
  level?: string;
}): Promise<StudentLeaderboardRow[]> {
  const { scope = 'cohort', limit = 50, cohortId, track, level } = params;
  try {
    const supabase = createClient();
    let query = supabase.from('student_leaderboard').select('*');

    if (scope === 'cohort' && cohortId) {
      query = query.eq('cohort_id', cohortId);
    } else if (scope === 'track_level' && track && level) {
      query = query.eq('track', track).eq('level', level);
    }
    // global = no filter

    query = query.order('total_points', { ascending: false }).limit(limit);
    const { data, error } = await query;
    if (error) throw error;

    // Compute rank (1-based) — view returns sorted by total_points DESC
    return (data ?? []).map((row, idx) => ({
      ...(row as StudentLeaderboardRow),
      rank: idx + 1,
    }));
  } catch (err) {
    console.warn('[submissions] fetchStudentLeaderboard error:', err);
    return [];
  }
}

/**
 * Fetch the current user's rank on the student leaderboard.
 * Returns null if user has no enrollment or isn't ranked yet.
 */
export async function fetchMyStudentRank(): Promise<{
  rank: number;
  total: number;
  row: StudentLeaderboardRow;
} | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('student_leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    // Count how many students have more points than me
    const { count } = await supabase
      .from('student_leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', (data as StudentLeaderboardRow).total_points);

    const total = (await supabase
      .from('student_leaderboard')
      .select('*', { count: 'exact', head: true })).count ?? 0;

    return {
      rank: (count ?? 0) + 1,
      total,
      row: data as StudentLeaderboardRow,
    };
  } catch (err) {
    console.warn('[submissions] fetchMyStudentRank error:', err);
    return null;
  }
}

/**
 * Fetch the teacher leaderboard (global — no scoping).
 * Reads from the live `teacher_leaderboard` view.
 */
export async function fetchTeacherLeaderboard(
  limit = 50
): Promise<TeacherLeaderboardRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('teacher_leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row, idx) => ({
      ...(row as TeacherLeaderboardRow),
      rank: idx + 1,
    }));
  } catch (err) {
    console.warn('[submissions] fetchTeacherLeaderboard error:', err);
    return [];
  }
}

/* ══════════════════════════════════ Writes (server-side via API routes) ═══ */

/**
 * Payload for creating a new submission.
 * Validated client-side + server-side (in the API route).
 */
export interface CreateSubmissionPayload {
  enrollment_id: string;
  booking_id?: string | null;
  module_num: number;
  lesson_name: string;
  capstone_step_title: string;
  title: string;
  description?: string;
  project_url: string;
  demo_url?: string;
  reflection_tricky?: string;
  reflection_proud?: string;
  /** Honeypot field — should be empty. Bots auto-fill hidden fields. */
  website?: string;
}

/**
 * Validate the create-submission payload on the client side.
 * Server-side validation happens in the API route (defense in depth).
 */
export function validateSubmissionPayload(
  payload: Partial<CreateSubmissionPayload>
): { ok: true; data: CreateSubmissionPayload } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!payload.enrollment_id) errors.push('Enrollment is required');
  if (!payload.module_num || payload.module_num < 1) errors.push('Module number is required');
  if (!payload.lesson_name || payload.lesson_name.trim().length < 2) errors.push('Lesson name is required');
  if (!payload.capstone_step_title) errors.push('Capstone step title is required');
  if (!payload.title || payload.title.trim().length < 3) errors.push('Project title must be at least 3 characters');
  if (payload.title && payload.title.length > 200) errors.push('Project title must be under 200 characters');
  if (payload.description && payload.description.length > 5000) errors.push('Description must be under 5000 characters');
  if (payload.reflection_tricky && payload.reflection_tricky.length > 2000) errors.push('Reflection must be under 2000 characters');
  if (payload.reflection_proud && payload.reflection_proud.length > 2000) errors.push('Reflection must be under 2000 characters');

  if (!payload.project_url) {
    errors.push('Project URL is required');
  } else {
    const urlCheck = validateProjectUrl(payload.project_url);
    if (!urlCheck.ok) errors.push(urlCheck.error!);
  }

  if (payload.demo_url) {
    const demoCheck = validateProjectUrl(payload.demo_url);
    if (!demoCheck.ok) errors.push(`Demo URL: ${demoCheck.error!}`);
  }

  // Honeypot — must be empty
  if (payload.website) {
    // Silently fail validation (don't tell the bot why)
    return { ok: false, errors: ['Invalid submission'] };
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      enrollment_id: payload.enrollment_id!,
      booking_id: payload.booking_id ?? null,
      module_num: payload.module_num!,
      lesson_name: payload.lesson_name!.trim(),
      capstone_step_title: payload.capstone_step_title!,
      title: payload.title!.trim(),
      description: payload.description?.trim() || undefined,
      project_url: validateProjectUrl(payload.project_url!).normalized!,
      demo_url: payload.demo_url ? validateProjectUrl(payload.demo_url).normalized : undefined,
      reflection_tricky: payload.reflection_tricky?.trim() || undefined,
      reflection_proud: payload.reflection_proud?.trim() || undefined,
    },
  };
}

/**
 * Create or update a submission via the API route.
 * The API route handles CSRF + honeypot + rate-limit + speed_points calculation.
 *
 * Returns the created/updated submission row, or an error.
 */
export async function submitProject(
  payload: CreateSubmissionPayload
): Promise<{ success: boolean; submission?: ProjectSubmissionRow; error?: string }> {
  try {
    const validation = validateSubmissionPayload(payload);
    if (!validation.ok) {
      return { success: false, error: validation.errors.join('; ') };
    }

    const res = await fetch('/api/student/submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
    });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || json.message || 'Submission failed' };
    }

    return { success: true, submission: json.submission as ProjectSubmissionRow };
  } catch (err) {
    console.warn('[submissions] submitProject error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Teacher reviews a submission via the API route.
 * The API route handles CSRF + honeypot + rate-limit + audit logging.
 */
export async function reviewSubmission(params: {
  submissionId: string;
  rating: number; // 1-5
  content: string;
  /** Three-way outcome: complete (full) / partial (half) / invalid (zero). */
  outcome?: 'complete' | 'partial' | 'invalid';
  /** Legacy — still accepted; complete=true, invalid=false. */
  approved?: boolean;
  /** Honeypot */
  website?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!params.submissionId) return { success: false, error: 'Missing submission ID' };
    if (!params.rating || params.rating < 1 || params.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }
    if (!params.content || params.content.trim().length < 10) {
      return { success: false, error: 'Feedback must be at least 10 characters' };
    }
    if (params.content.length > 5000) {
      return { success: false, error: 'Feedback must be under 5000 characters' };
    }

    const outcome = params.outcome ?? (params.approved === false ? 'invalid' : 'complete');
    const res = await fetch('/api/teacher/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: params.submissionId,
        rating: params.rating,
        content: params.content.trim(),
        outcome,
        website: params.website ?? '',
      }),
    });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || json.message || 'Review failed' };
    }

    return { success: true };
  } catch (err) {
    console.warn('[submissions] reviewSubmission error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
