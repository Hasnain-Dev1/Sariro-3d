'use client';

import { GraduationCap } from 'lucide-react';
import {
  summariseCapabilities, capabilityDetail,
  type TeacherAssignmentRow,
} from '@/lib/dashboard/teacher-capability';

/**
 * SARIRO — what this teacher is trained for, as chips
 * ============================================================================
 * One component, because this has to say the same thing on five screens:
 * super-admin, admin and HR looking at a teacher; the teacher looking at
 * themselves; and the trial booker choosing who to put in front of a child.
 * Five near-copies of a chip list is five chances for one of them to round
 * "half trained" up to "trained".
 *
 * ── Green is trained, amber is not ──────────────────────────────────────────
 * A teacher can be made eligible for a subject before the training has
 * happened, and that is a real state an admin needs to see rather than a
 * technicality. Amber says the row exists and the preparation does not — which
 * is exactly when somebody should not be scheduled.
 *
 * Nothing here is a permission check. `isTrainedFor` in the lib is the strict
 * per-course question and it is what the scheduler asks; these chips are a
 * summary for a person reading a screen, and a summary must never be what
 * decides who teaches a Grade 9 class.
 */
export default function CapabilityChips({
  assignments,
  size = 'md',
  emptyText = 'No courses yet',
  max = 0,
}: {
  assignments: TeacherAssignmentRow[] | null | undefined;
  size?: 'sm' | 'md';
  emptyText?: string;
  max?: number;
}) {
  const caps = summariseCapabilities(assignments);

  if (caps.length === 0) {
    return (
      <span className="text-[11px] text-slate-400 italic">{emptyText}</span>
    );
  }

  const shown = max > 0 ? caps.slice(0, max) : caps;
  const hidden = caps.length - shown.length;
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((c) => (
        <span
          key={c.track}
          title={`${c.label} — ${capabilityDetail(c)}`}
          className={`inline-flex items-center gap-1 rounded-lg font-bold ${pad} ${
            c.trained
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {c.trained && <GraduationCap className="w-3 h-3" aria-hidden="true" />}
          {c.label}
          {size === 'md' && (
            <span className="font-medium opacity-70">· {capabilityDetail(c)}</span>
          )}
        </span>
      ))}
      {hidden > 0 && (
        <span className={`rounded-lg font-bold bg-slate-100 text-slate-600 ${pad}`}
              style={{ fontFamily: 'var(--font-grotesk)' }}>
          +{hidden}
        </span>
      )}
    </div>
  );
}
