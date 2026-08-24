'use client';

import { useState } from 'react';
import { Pencil, Loader2, Check, X, Lock, LockOpen } from 'lucide-react';
import { updateStudentName } from '@/lib/dashboard/admin-data';

/**
 * StudentNameEditor — a small pencil affordance an admin / super-admin can use
 * to rename a student and (optionally) lock the student out of changing their
 * own name from Settings. Writes go through the service-role route
 * /api/admin/update-student-name (see updateStudentName()).
 *
 * Drop it in next to a student's rendered name. It renders ONLY the pencil
 * button until clicked, then a compact inline popover — so it never disturbs
 * the surrounding row layout.
 */
export default function StudentNameEditor({
  userId,
  currentName,
  nameLocked = false,
  onSaved,
  onError,
}: {
  userId: string;
  currentName: string | null;
  nameLocked?: boolean;
  onSaved?: (newName: string, newLocked: boolean) => void;
  onError?: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName ?? '');
  const [locked, setLocked] = useState(nameLocked);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setName(currentName ?? '');
    setLocked(nameLocked);
    setOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { onError?.('Name cannot be empty.'); return; }
    setSaving(true);
    const res = await updateStudentName(userId, { fullName: trimmed, nameLocked: locked });
    setSaving(false);
    if (res.success) {
      onSaved?.(trimmed, locked);
      setOpen(false);
    } else {
      onError?.(res.error || 'Failed to update name.');
    }
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={start}
        title="Edit student name"
        aria-label="Edit student name"
        className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-[89]" onClick={() => !saving && setOpen(false)} aria-hidden="true" />
          <div
            className="absolute left-0 top-8 z-[90] w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Student name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ fontFamily: 'var(--font-inter)' }}
            />

            <button
              type="button"
              onClick={() => setLocked((v) => !v)}
              className={`mt-2 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-colors ${
                locked ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
              title={locked ? 'Student CANNOT change their own name' : 'Student CAN change their own name'}
            >
              {locked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
              {locked ? 'Name locked (only admin can change)' : 'Student can change their own name'}
            </button>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold disabled:opacity-50"
                style={{ fontFamily: 'var(--font-grotesk)' }}
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </span>
  );
}
