/**
 * SARIRO — which link a class opens
 * ============================================================================
 * The founder, 15 Sep 2026: a teacher sets their own meeting link once, and
 * every class they teach uses it — trial or regular. When they change it, every
 * class changes with it. A teacher is never in two classes at once, so one room
 * is all they need, and nobody has to make a link per class.
 *
 * Before this, a teacher's room (profiles.meet_url) reached trials only; a
 * regular class opened whatever link had been copied onto its batch by an
 * admin, and a teacher who moved from Meet to Zoom sent half their students to
 * a door that no longer opened.
 *
 * So the order is:
 *
 *   1. the teacher's own room      — always, when they have set one
 *   2. the link on the class       — a class booked before the teacher had a room
 *   3. the link on the batch       — the old admin-set room, last resort
 *
 * Applied wherever a Join button gets its link: the student's join route, the
 * trial page, the teacher's calendar, and the staff and seller trial screens.
 * Saving a room also rewrites the stored link on every upcoming class
 * (api/teacher/room), so anything that reads the stored link agrees too.
 */

const clean = (v: string | null | undefined): string | null => {
  const t = (v ?? '').trim();
  return t ? t : null;
};

export function classLink(
  teacherRoom: string | null | undefined,
  classRoom?: string | null,
  batchRoom?: string | null
): string | null {
  return clean(teacherRoom) ?? clean(classRoom) ?? clean(batchRoom);
}
