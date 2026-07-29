'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Star,
  MessageCircle,
  Lock,
  Calendar,
  ExternalLink,
  Sparkles,
  Target,
  Package,
  Lightbulb,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { findEnrichedLessonByName, getCapstone } from '@/lib/capstones';
import {
  fetchSubmissionForLesson,
  submitProject,
  validateProjectUrl,
  type ProjectSubmissionRow,
  type SubmissionFeedbackRow,
} from '@/lib/dashboard/submissions-data';
import { HoneypotField } from '@/components/security/honeypot';

/* ════════════════════════════════════════════════════════════════════════
   Page state machine:
     loading → not-enrolled | absent | locked | empty-form | submitted | reviewed
   ════════════════════════════════════════════════════════════════════════ */

type PageState =
  | { kind: 'loading' }
  | { kind: 'not-enrolled' }
  | { kind: 'course-completed' }
  | { kind: 'absent'; rescheduledDate: Date | null }
  | { kind: 'locked'; slotStart: Date }
  | { kind: 'empty-form' }
  | { kind: 'submitted'; submission: ProjectSubmissionRow }
  | { kind: 'reviewed-approved'; submission: ProjectSubmissionRow; feedback: SubmissionFeedbackRow }
  | { kind: 'reviewed-resubmit'; submission: ProjectSubmissionRow; feedback: SubmissionFeedbackRow };

interface BookingInfo {
  id: string;
  cohort_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  module_num: number | null;
  lesson_name: string | null;
  teacher_id: string;
}

interface CohortInfo {
  track: string;
  level: string;
}

interface EnrollmentInfo {
  id: string;
  user_id: string;
  cohort_id: string | null;
  track: string;
  level: string;
  status: string;
}

interface AttendanceInfo {
  status: string;
}

/* ════════════════════════════════════════════════════════════════════════ */

export default function SubmitProjectPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [cohort, setCohort] = useState<CohortInfo | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [enriched, setEnriched] = useState<ReturnType<typeof findEnrichedLessonByName>>(null);
  const [capstone, setCapstone] = useState<ReturnType<typeof getCapstone>>(null);
  const [existingSubmission, setExistingSubmission] = useState<ProjectSubmissionRow | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<SubmissionFeedbackRow | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ─── Load all data on mount ─── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setLoadError('Not signed in');
          return;
        }

        // 1. Fetch the booking
        const { data: bookingRow, error: bErr } = await supabase
          .from('bookings')
          .select('id, cohort_id, slot_start, slot_end, status, module_num, lesson_name, teacher_id')
          .eq('id', params.bookingId)
          .maybeSingle();
        if (bErr) throw bErr;
        if (!bookingRow) {
          if (!cancelled) setLoadError('Booking not found');
          return;
        }
        const b = bookingRow as BookingInfo;
        if (!cancelled) setBooking(b);

        // 2. Fetch the cohort (for track + level)
        const { data: cohortRow } = await supabase
          .from('cohorts')
          .select('track, level')
          .eq('id', b.cohort_id)
          .maybeSingle();
        if (!cancelled) setCohort(cohortRow as CohortInfo | null);

        // 3. Fetch the student's enrollment for this cohort
        const { data: enrollRow } = await supabase
          .from('enrollments')
          .select('id, user_id, cohort_id, track, level, status')
          .eq('user_id', user.id)
          .eq('cohort_id', b.cohort_id)
          .in('status', ['active', 'completed'])
          .maybeSingle();
        if (!cancelled) setEnrollment(enrollRow as EnrollmentInfo | null);

        // 4. Fetch attendance for this student + booking
        const { data: attRow } = await supabase
          .from('session_attendance')
          .select('status')
          .eq('booking_id', b.id)
          .eq('student_id', user.id)
          .maybeSingle();
        const attendance = attRow as AttendanceInfo | null;

        // 5. Fetch teacher name
        if (b.teacher_id) {
          const { data: teacherRow } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', b.teacher_id)
            .maybeSingle();
          if (!cancelled) setTeacherName(teacherRow?.full_name ?? null);
        }

        // 6. Look up enriched lesson data
        if (cohortRow && b.module_num && b.lesson_name) {
          const courseId = `${cohortRow.track}-${cohortRow.level.toLowerCase()}`;
          const enrichedLesson = findEnrichedLessonByName(
            courseId,
            String(b.module_num).padStart(2, '0'),
            b.lesson_name
          );
          if (!cancelled) setEnriched(enrichedLesson);
          if (!cancelled) setCapstone(getCapstone(courseId));
        }

        // 7. Check for existing submission (if enrolled)
        if (enrollRow) {
          if (b.module_num) {
            const result = await fetchSubmissionForLesson(enrollRow.id, b.module_num);
            if (!cancelled) {
              // fetchSubmissionForLesson returns SubmissionWithFeedback which extends ProjectSubmissionRow
              // so we can assign it directly + extract feedback separately
              setExistingSubmission(result as ProjectSubmissionRow | null);
              setExistingFeedback(result?.feedback ?? null);
            }
          }
        }

        // 8. Determine page state
        if (!cancelled) {
          if (!enrollRow) {
            setState({ kind: 'not-enrolled' });
          } else if (enrollRow.status === 'completed') {
            // Course already completed — show locked "course completed" state
            setState({ kind: 'course-completed' });
          } else if (attendance?.status === 'absent') {
            // Absent — show absent screen, check if booking was rescheduled
            const slotEnd = new Date(b.slot_end);
            const now = new Date();
            const rescheduledDate = slotEnd > now ? slotEnd : null;
            setState({ kind: 'absent', rescheduledDate });
          } else if (b.status !== 'completed') {
            // Class not completed yet — locked
            setState({ kind: 'locked', slotStart: new Date(b.slot_start) });
          } else if (existingSubmission) {
            // Already submitted — check feedback
            if (existingSubmission.status === 'approved') {
              setState({
                kind: 'reviewed-approved',
                submission: existingSubmission,
                feedback: existingFeedback!,
              });
            } else if (existingSubmission.status === 'resubmit') {
              setState({
                kind: 'reviewed-resubmit',
                submission: existingSubmission,
                feedback: existingFeedback!,
              });
            } else {
              setState({ kind: 'submitted', submission: existingSubmission });
            }
          } else {
            setState({ kind: 'empty-form' });
          }
        }
      } catch (err) {
        console.warn('[submit-page] load error:', err);
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load');
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.bookingId]);

  /* ─── Render ─── */
  if (loadError) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {loadError}
          </h1>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 mt-4 min-h-[44px] px-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (state.kind === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-slate-50"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 min-h-[44px] px-2 -ml-2 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          {booking?.module_num && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <span>Lesson {booking.module_num}</span>
              {capstone && <span className="text-slate-400">of {capstone.total_steps}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {state.kind === 'not-enrolled' && <NotEnrolledState />}
        {state.kind === 'course-completed' && <CourseCompletedState />}
        {state.kind === 'absent' && <AbsentState rescheduledDate={state.rescheduledDate} />}
        {state.kind === 'locked' && (
          <LockedState
            slotStart={state.slotStart}
            lessonName={booking?.lesson_name ?? null}
            enriched={enriched}
            teacherName={teacherName}
          />
        )}
        {(state.kind === 'empty-form' || state.kind === 'reviewed-resubmit') && (
          <SubmissionForm
            booking={booking}
            cohort={cohort}
            enrollment={enrollment}
            enriched={enriched}
            capstone={capstone}
            teacherName={teacherName}
            existingSubmission={state.kind === 'reviewed-resubmit' ? state.submission : null}
            existingFeedback={state.kind === 'reviewed-resubmit' ? state.feedback : null}
            onSubmitted={(sub) => setState({ kind: 'submitted', submission: sub })}
          />
        )}
        {state.kind === 'submitted' && (
          <SubmittedState
            submission={state.submission}
            onEdit={() => setState({ kind: 'empty-form' })}
          />
        )}
        {state.kind === 'reviewed-approved' && (
          <ReviewedApprovedState
            submission={state.submission}
            feedback={state.feedback}
            teacherName={teacherName}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   State: Course Completed — enrollment is done, no more submissions
   ════════════════════════════════════════════════════════════════════════ */

function CourseCompletedState() {
  return (
    <Card>
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
          Course completed 🎉
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          You&apos;ve finished all the lessons in this course. New submissions are locked — but you can still review your past work and feedback below.
        </p>
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold touch-manipulation"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    </Card>
  );
}


/* ════════════════════════════════════════════════════════════════════════
   State: Not Enrolled
   ════════════════════════════════════════════════════════════════════════ */

function NotEnrolledState() {
  return (
    <Card>
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
          You&apos;re not enrolled in this class
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          This class belongs to a cohort you&apos;re not part of. If you think this is a mistake, contact your teacher.
        </p>
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold touch-manipulation"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   State: Absent — NO submission form, show rescheduled date
   ════════════════════════════════════════════════════════════════════════ */

function AbsentState({ rescheduledDate }: { rescheduledDate: Date | null }) {
  return (
    <Card>
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
          You were marked absent
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          You won&apos;t see the after-class project for this lesson. You can submit your project after the rescheduled class.
        </p>

        {rescheduledDate ? (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
              <Calendar className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Rescheduled to
              </span>
            </div>
            <p className="text-lg font-extrabold text-blue-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {rescheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm font-bold text-blue-700">
              {rescheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        ) : (
          <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-slate-600">
              Your teacher hasn&apos;t rescheduled this class yet. Contact them to schedule a make-up session.
            </p>
          </div>
        )}

        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold touch-manipulation"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   State: Locked — class hasn't happened yet
   ════════════════════════════════════════════════════════════════════════ */

function LockedState({
  slotStart,
  lessonName,
  enriched,
  teacherName,
}: {
  slotStart: Date;
  lessonName: string | null;
  enriched: ReturnType<typeof findEnrichedLessonByName>;
  teacherName: string | null;
}) {
  const now = new Date();
  const diffMs = slotStart.getTime() - now.getTime();
  const isUpcoming = diffMs > 0;
  const hoursUntil = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const minutesUntil = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="space-y-4">
      {/* Lesson brief (visible even when locked — student can prep) */}
      <LessonBrief enriched={enriched} lessonName={lessonName} teacherName={teacherName} />

      {/* Lock notice */}
      <Card>
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {isUpcoming ? 'Class hasn\'t started yet' : 'Waiting for class to end'}
          </h2>
          {isUpcoming && (
            <p className="text-sm text-slate-600 mb-4">
              Starts in {hoursUntil > 0 && `${hoursUntil}h `}{minutesUntil}m
            </p>
          )}
          <p className="text-sm text-slate-600 mb-6">
            The project submission form unlocks after your class ends. Review the lesson brief above to prep!
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <Clock className="w-4 h-4" />
            <span>{slotStart.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   State: Empty form (or resubmit form)
   ════════════════════════════════════════════════════════════════════════ */

function SubmissionForm({
  booking,
  cohort,
  enrollment,
  enriched,
  capstone,
  teacherName,
  existingSubmission,
  existingFeedback,
  onSubmitted,
}: {
  booking: BookingInfo | null;
  cohort: CohortInfo | null;
  enrollment: EnrollmentInfo | null;
  enriched: ReturnType<typeof findEnrichedLessonByName>;
  capstone: ReturnType<typeof getCapstone>;
  teacherName: string | null;
  existingSubmission: ProjectSubmissionRow | null;
  existingFeedback: SubmissionFeedbackRow | null;
  onSubmitted: (sub: ProjectSubmissionRow) => void;
}) {
  const [title, setTitle] = useState(existingSubmission?.title ?? '');
  const [projectUrl, setProjectUrl] = useState(existingSubmission?.project_url ?? '');
  const [demoUrl, setDemoUrl] = useState(existingSubmission?.demo_url ?? '');
  const [description, setDescription] = useState(existingSubmission?.description ?? '');
  const [tricky, setTricky] = useState(existingSubmission?.reflection_tricky ?? '');
  const [proud, setProud] = useState(existingSubmission?.reflection_proud ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors([]);
      setSubmitError(null);

      // Client-side validation
      const fieldErrors: string[] = [];
      if (!title.trim() || title.trim().length < 3) fieldErrors.push('Title must be at least 3 characters');
      if (!projectUrl.trim()) fieldErrors.push('Project URL is required');
      else {
        const urlCheck = validateProjectUrl(projectUrl);
        if (!urlCheck.ok) fieldErrors.push(urlCheck.error!);
      }
      if (demoUrl.trim()) {
        const demoCheck = validateProjectUrl(demoUrl);
        if (!demoCheck.ok) fieldErrors.push(`Demo URL: ${demoCheck.error!}`);
      }
      if (!description.trim() || description.trim().length < 10) {
        fieldErrors.push('Please tell us about your project (at least 10 characters)');
      }
      if (fieldErrors.length > 0) {
        setErrors(fieldErrors);
        return;
      }

      if (!enrollment || !booking?.module_num || !booking?.lesson_name) {
        setSubmitError('Missing enrollment or lesson info. Please refresh the page.');
        return;
      }

      // Derive capstone step title from enriched data or fallback
      const capstoneStepTitle = enriched?.capstone_step?.title ?? 'Capstone step';

      setSubmitting(true);
      const result = await submitProject({
        enrollment_id: enrollment.id,
        booking_id: booking.id,
        module_num: booking.module_num,
        lesson_name: booking.lesson_name,
        capstone_step_title: capstoneStepTitle,
        title: title.trim(),
        description: description.trim(),
        project_url: projectUrl.trim(),
        demo_url: demoUrl.trim() || undefined,
        reflection_tricky: tricky.trim() || undefined,
        reflection_proud: proud.trim() || undefined,
      });
      setSubmitting(false);

      if (!result.success || !result.submission) {
        setSubmitError(result.error || 'Submission failed');
        return;
      }
      onSubmitted(result.submission);
    },
    [title, projectUrl, demoUrl, description, tricky, proud, enrollment, booking, enriched, onSubmitted]
  );

  return (
    <div className="space-y-4">
      {/* Lesson brief */}
      <LessonBrief enriched={enriched} lessonName={booking?.lesson_name ?? null} teacherName={teacherName} />

      {/* Resubmit banner */}
      {existingFeedback && existingSubmission?.status === 'resubmit' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-extrabold text-amber-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Teacher feedback — please resubmit
            </h3>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-4 h-4 ${n <= existingFeedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-amber-800 whitespace-pre-wrap">{existingFeedback.content}</p>
        </div>
      )}

      {/* Submission form */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {existingSubmission ? 'Edit your project' : 'Submit your project'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <HoneypotField name="website" />

          {/* Title */}
          <Field label="Project title" required error={errors.find((e) => e.startsWith('Title'))}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={submitting}
              placeholder="e.g. My branching adventure game"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </Field>

          {/* Project URL */}
          <Field
            label="Project URL (GitHub, Replit, CodePen, etc.)"
            required
            error={errors.find((e) => e.startsWith('Project URL'))}
            hint="Must be HTTPS and from a trusted host (github.com, replit.com, codepen.io, etc.)"
          >
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              maxLength={2048}
              disabled={submitting}
              placeholder="https://github.com/yourname/your-project"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </Field>

          {/* Demo URL */}
          <Field label="Live demo URL (optional)" error={errors.find((e) => e.startsWith('Demo URL'))}>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              maxLength={2048}
              disabled={submitting}
              placeholder="https://your-demo.vercel.app"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </Field>

          {/* Description */}
          <Field
            label="Tell us about it"
            required
            error={errors.find((e) => e.startsWith('Please tell us'))}
            hint="What does your project do? How did you build it?"
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={4}
              disabled={submitting}
              placeholder="I built a text adventure game where the player chooses left or right. I used if/else to branch the story..."
              className="w-full min-h-[88px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 resize-y"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </Field>

          {/* Reflection: Tricky */}
          <Field label="What was tricky? (optional)" hint="What part was hardest to figure out?">
            <textarea
              value={tricky}
              onChange={(e) => setTricky(e.target.value)}
              maxLength={2000}
              rows={2}
              disabled={submitting}
              placeholder="The elif chain was confusing at first..."
              className="w-full min-h-[66px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 resize-y"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </Field>

          {/* Reflection: Proud */}
          <Field label="What are you proud of? (optional)" hint="What's your favorite part?">
            <textarea
              value={proud}
              onChange={(e) => setProud(e.target.value)}
              maxLength={2000}
              rows={2}
              disabled={submitting}
              placeholder="I'm proud of the random encounter system..."
              className="w-full min-h-[66px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 resize-y"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </Field>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[52px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-base font-bold flex items-center justify-center gap-2 touch-manipulation transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> {existingSubmission ? 'Update submission' : 'Submit project'}
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   State: Submitted (waiting for review)
   ════════════════════════════════════════════════════════════════════════ */

function SubmittedState({
  submission,
  onEdit,
}: {
  submission: ProjectSubmissionRow;
  onEdit: () => void;
}) {
  const submittedAgo = formatTimeAgo(new Date(submission.submitted_at));
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Under review
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Submitted {submittedAgo} · +{submission.speed_points} speed points earned
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            Your teacher will review your project and give feedback soon. You&apos;ll get a notification when it&apos;s ready.
          </div>
        </div>
      </Card>

      <SubmissionPreview submission={submission} />

      <button
        onClick={onEdit}
        className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold touch-manipulation"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        Edit submission
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   State: Reviewed — Approved
   ════════════════════════════════════════════════════════════════════════ */

function ReviewedApprovedState({
  submission,
  feedback,
  teacherName,
}: {
  submission: ProjectSubmissionRow;
  feedback: SubmissionFeedbackRow;
  teacherName: string | null;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Approved! 🎉
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            +15 approval points · Capstone piece unlocked · Lesson marked complete
          </p>
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-8 h-8 ${n <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
              />
            ))}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {teacherName ?? 'Your teacher'}
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{feedback.content}</p>
          </div>
        </div>
      </Card>

      <SubmissionPreview submission={submission} />

      <Link
        href="/dashboard/student"
        className="block w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <Sparkles className="w-4 h-4" /> Back to dashboard
      </Link>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Shared components
   ════════════════════════════════════════════════════════════════════════ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">{children}</div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function LessonBrief({
  enriched,
  lessonName,
  teacherName,
}: {
  enriched: ReturnType<typeof findEnrichedLessonByName>;
  lessonName: string | null;
  teacherName: string | null;
}) {
  if (!enriched) {
    // Non-enriched lesson — show minimal brief
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {lessonName ?? 'Lesson'}
          </h2>
        </div>
        {teacherName && (
          <p className="text-sm text-slate-500">
            Taught by {teacherName}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {enriched.name}
        </h2>
      </div>
      <p className="text-sm text-slate-600 mb-3">{enriched.topic}</p>
      {teacherName && (
        <p className="text-xs text-slate-500 mb-3">Taught by {teacherName}</p>
      )}

      {/* Objectives */}
      {enriched.objectives.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            📋 In this lesson you&apos;ll learn
          </h3>
          <ul className="space-y-1">
            {enriched.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Capstone step */}
      {enriched.capstone_step && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
              🎯 Capstone step
            </h3>
          </div>
          <p className="text-sm font-extrabold text-violet-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {enriched.capstone_step.title}
          </p>
          <p className="text-sm text-violet-800 mb-2">{enriched.capstone_step.description}</p>
          <div className="flex items-start gap-2 text-xs text-violet-700">
            <Package className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Deliverable:</strong> {enriched.capstone_step.deliverable}</span>
          </div>
          {enriched.capstone_step.starter_hint && (
            <div className="mt-2 bg-slate-900 rounded-lg p-2.5 overflow-x-auto">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Starter hint
                </span>
              </div>
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono">{enriched.capstone_step.starter_hint}</pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SubmissionPreview({ submission }: { submission: ProjectSubmissionRow }) {
  return (
    <Card>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
        Your submission
      </h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-slate-500">Title:</span>{' '}
          <span className="font-bold text-slate-900">{submission.title}</span>
        </div>
        <div>
          <span className="text-slate-500">Project:</span>{' '}
          <a
            href={submission.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold break-all"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span>{submission.project_url}</span>
          </a>
        </div>
        {submission.demo_url && (
          <div>
            <span className="text-slate-500">Demo:</span>{' '}
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold break-all"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>{submission.demo_url}</span>
            </a>
          </div>
        )}
        {submission.description && (
          <div className="pt-2">
            <span className="text-slate-500">About:</span>
            <p className="text-slate-700 mt-1 whitespace-pre-wrap">{submission.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════════ */

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
