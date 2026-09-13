/** What /api/staff/certificates returns — shared by the route and the panel. */

export interface StaffEnrolment {
  id: string;
  track: string;
  trackName: string;
  level: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  progress: { done: number; total: number };
  certificateUrl: string | null;
  issuedBy: string | null;
}

export interface StaffTrial {
  bookingId: string;
  subject: string;
  classDate: string | null;
  eligible: boolean;
  reason: string | null;
  certificateUrl: string | null;
}

export interface StaffStudent {
  id: string;
  name: string;
  email: string | null;
  enrolments: StaffEnrolment[];
  trials: StaffTrial[];
}
