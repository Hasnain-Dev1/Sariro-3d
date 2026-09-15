import {
  CalendarX2, CalendarClock, UserCheck, Users, Receipt, Coins, Wallet, ShieldAlert, GraduationCap,
  BatteryLow, Plane, Award, Banknote, ClipboardCheck, PenLine, Link2Off, FolderOpen, Compass, Phone,
  PhoneMissed, Handshake, PauseCircle, Video, Mic, type LucideIcon,
} from 'lucide-react';
import type { AttentionIcon } from '@/lib/ops/attention';

/** The registry names icons by meaning; this is the one place they become components. */
export const OPS_ICON: Record<AttentionIcon, LucideIcon> = {
  'calendar-x': CalendarX2,
  'calendar-clock': CalendarClock,
  'user-check': UserCheck,
  users: Users,
  receipt: Receipt,
  coins: Coins,
  wallet: Wallet,
  shield: ShieldAlert,
  graduation: GraduationCap,
  battery: BatteryLow,
  plane: Plane,
  award: Award,
  banknote: Banknote,
  clipboard: ClipboardCheck,
  pen: PenLine,
  link: Link2Off,
  folder: FolderOpen,
  compass: Compass,
  phone: Phone,
  'phone-missed': PhoneMissed,
  handshake: Handshake,
  pause: PauseCircle,
  video: Video,
  mic: Mic,
};
