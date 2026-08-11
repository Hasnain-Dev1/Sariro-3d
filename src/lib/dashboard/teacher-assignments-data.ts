
/**
 * SARIRO — Teacher Course Eligibility data layer
 */

import { createClient } from '@/lib/supabase/client';
import { TRACKS } from '@/lib/sariro-data';

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  track: string;
  level: string;
  assigned_by: string | null;
  created_at: string;
  teacher_name?: string | null;
  teacher_email?: string | null;
}

export interface TeacherWithAssignments {
  id: string;
  full_name: string | null;
  email: string | null;
  assignments: Array<{ track: string; level: string; training_completed_at: string | null }>;
}

export async function fetchAllTeacherAssignments(): Promise<TeacherAssignment[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('teacher_course_assignments').select(`*, teacher:teacher_id(full_name, email)`).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const teacher = r.teacher as { full_name: string | null; email: string | null } | null;
      return { ...(r as Omit<TeacherAssignment, 'teacher_name' | 'teacher_email'>), teacher_name: teacher?.full_name ?? null, teacher_email: teacher?.email ?? null } as TeacherAssignment;
    });
  } catch (err) {
    console.warn('[teacher-assignments] fetchAll error:', err);
    return [];
  }
}

export async function fetchTeachersWithAssignments(): Promise<TeacherWithAssignments[]> {
  try {
    const supabase = createClient();
    const { data: teachers, error: tErr } = await supabase.from('profiles').select('id, full_name, email').or('role.eq.teacher,is_teacher.eq.true').order('full_name', { ascending: true });
    if (tErr) throw tErr;
    const { data: assignments, error: aErr } = await supabase.from('teacher_course_assignments').select('teacher_id, track, level, training_completed_at');
    if (aErr) throw aErr;
    const assignmentMap = new Map<string, Array<{ track: string; level: string; training_completed_at: string | null }>>();
    for (const a of assignments ?? []) {
      const tid = a.teacher_id as string;
      if (!assignmentMap.has(tid)) assignmentMap.set(tid, []);
      assignmentMap.get(tid)!.push({ track: a.track as string, level: a.level as string, training_completed_at: (a.training_completed_at as string | null) ?? null });
    }
    return (teachers ?? []).map((t) => ({ id: t.id as string, full_name: t.full_name as string | null, email: t.email as string | null, assignments: assignmentMap.get(t.id as string) ?? [] }));
  } catch (err) {
    console.warn('[teacher-assignments] fetchTeachersWithAssignments error:', err);
    return [];
  }
}

export async function fetchMyAssignments(): Promise<Array<{ track: string; level: string }>> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('teacher_course_assignments').select('track, level').eq('teacher_id', user.id);
    if (error) throw error;
    return (data ?? []).map((a) => ({ track: a.track as string, level: a.level as string }));
  } catch (err) {
    console.warn('[teacher-assignments] fetchMyAssignments error:', err);
    return [];
  }
}

export async function isTeacherEligible(teacherId: string, track: string, level: string): Promise<boolean> {
  if (!teacherId || !track || !level) return false;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('teacher_course_assignments').select('id').eq('teacher_id', teacherId).eq('track', track).eq('level', level).maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (err) {
    console.warn('[teacher-assignments] isTeacherEligible error:', err);
    return false;
  }
}

export async function assignTeacherCourse(teacherId: string, track: string, level: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/teacher-assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign', teacher_id: teacherId, track, level }) });
    const json = await res.json();
    if (!res.ok || !json.ok) return { success: false, error: json.error || 'Assignment failed' };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function removeTeacherCourse(teacherId: string, track: string, level: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/teacher-assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', teacher_id: teacherId, track, level }) });
    const json = await res.json();
    if (!res.ok || !json.ok) return { success: false, error: json.error || 'Removal failed' };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/** Super-admin only: mark (or revoke) a teacher's course training as complete.
 *  Gates whether the teacher can be picked in the scheduling tool. */
export async function setTeacherTraining(teacherId: string, track: string, level: string, complete: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/teacher-assignments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: complete ? 'complete_training' : 'revoke_training', teacher_id: teacherId, track, level }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return { success: false, error: json.message || json.error || 'Training update failed' };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const ALL_LEVELS = ['Elementary', 'Beginner', 'Intermediate', 'Advanced'];

export function getTrackName(trackId: string): string {
  return TRACKS.find((t) => t.id === trackId)?.name ?? trackId;
}