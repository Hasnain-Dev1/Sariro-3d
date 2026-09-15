'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, X, Loader2, Users, Phone, LogIn, Ban, LockOpen,
} from 'lucide-react';
import {
  fetchUsers, updateUserRole, exportUsersCSV,
  type UserRow,
} from '@/lib/dashboard/admin-data';
import StudentNameEditor from '@/components/dashboard/student-name-editor';
import { UnknownBadge } from '@/components/dashboard/unknown-contact';

/* ════════════════════════════════════════════════════════════════════════
   UserManagementModal — shared between admin + super-admin dashboards
   Features:
   - Search by name/email
   - Filter by role
   - Change user role (dropdown)
   - Sign in as user (impersonation)
   - Block / unblock a user (super admin only — offboarding)
   - Export CSV
   ════════════════════════════════════════════════════════════════════════ */

export function UserManagementModal({
  open, onClose, onToast, canManageStaff = false,
}: {
  open: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error', message: string) => void;
  /** Only super-admins may grant HR / Admin / Super Admin. Hides those options
   *  when false (the server enforces this regardless). */
  canManageStaff?: boolean;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  /* Who is blocked, from the auth server (api/admin/users/block). Super admin
     only, so this stays empty and the controls stay hidden for an admin. */
  const [blocked, setBlocked] = useState<Map<string, string | null>>(new Map());
  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    if (!open || !canManageStaff) return;
    let cancelled = false;
    fetch('/api/admin/users/block', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.ok) return;
        setBlocked(new Map((j.blocked as { id: string; reason: string | null }[]).map((b) => [b.id, b.reason])));
      })
      .catch(() => { /* the list simply shows nobody as blocked */ });
    return () => { cancelled = true; };
  }, [open, canManageStaff]);

  const setBlock = async (userId: string, userName: string, block: boolean) => {
    if (!block && !confirm(`Unblock ${userName}? They will be able to sign in again straight away.`)) return;
    setBusyUserId(userId);
    try {
      const res = await fetch('/api/admin/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, blocked: block, reason: block ? blockReason.trim() || undefined : undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setBlocked((prev) => {
          const next = new Map(prev);
          if (block) next.set(userId, blockReason.trim() || null);
          else next.delete(userId);
          return next;
        });
        setConfirmBlockId(null);
        setBlockReason('');
        onToast('success', block ? `${userName} is blocked and signed out of Sariro` : `${userName} can sign in again`);
      } else {
        onToast('error', data.message || data.error || 'That did not work');
      }
    } catch {
      onToast('error', 'Network error — nothing changed');
    } finally {
      setBusyUserId(null);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve().then(() => setLoading(true));
    fetchUsers(debouncedSearch, roleFilter).then((rows) => {
      if (cancelled) return;
      Promise.resolve().then(() => {
        setUsers(rows);
        setLoading(false);
      });
    });
    return () => { cancelled = true; };
  }, [open, debouncedSearch, roleFilter]);

  const handleRoleChange = async (
    userId: string,
    newRole: 'student' | 'teacher' | 'seller' | 'hr' | 'admin' | 'super_admin'
  ) => {
    setBusyUserId(userId);
    const result = await updateUserRole(userId, newRole);
    setBusyUserId(null);
    if (result.success) {
      setUsers((prev) => prev.map((u) => u.id === userId ? {
        ...u,
        role: newRole,
        is_student: newRole === 'student',
        is_teacher: newRole === 'teacher',
        is_seller: newRole === 'seller',
        is_hr: newRole === 'hr',
        is_admin: newRole === 'admin' || newRole === 'super_admin',
        is_super_admin: newRole === 'super_admin',
      } : u));
      onToast('success', 'Role updated');
    } else {
      onToast('error', result.error || 'Failed to update role');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportUsersCSV();
    setExporting(false);
    if (result.success) {
      onToast('success', 'Users CSV downloaded');
    } else {
      onToast('error', result.error || 'Failed to export CSV');
    }
  };

  const handleImpersonate = async (userId: string, userName: string) => {
    if (!confirm(`Sign in as ${userName}? You'll see their dashboard exactly as they do. Click "Exit impersonation" in the banner to return to your admin account.`)) {
      return;
    }
    setBusyUserId(userId);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      if (data.ok) {
        onToast('success', `Now signed in as ${userName}`);
        window.location.href = data.redirectTo || '/dashboard';
      } else {
        onToast('error', data.error || 'Failed to impersonate user');
      }
    } catch {
      onToast('error', 'Network error during impersonation');
    } finally {
      setBusyUserId(null);
    }
  };

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !exporting && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="User management"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  User Management
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {users.length} {users.length === 1 ? 'user' : 'users'} found.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExport}
                  disabled={exporting || users.length === 0}
                  className="min-h-[40px] px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  CSV
                </button>
                <button
                  onClick={() => !exporting && onClose()}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search + role filter */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="seller">Sellers</option>
                <option value="hr">HR</option>
                <option value="admin">Admins</option>
                <option value="super_admin">Super Admins</option>
              </select>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No users match your search.</p>
                </div>
              ) : (
                users.map((u) => {
                  const displayName = u.full_name || u.email || 'Unknown user';
                  const initial = displayName.charAt(0).toUpperCase();
                  const isBlocked = blocked.has(u.id);
                  return (
                    <div key={u.id} className={`rounded-xl border ${isBlocked ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {displayName}
                            </div>
                            <UnknownBadge contact={u} />
                            {/* Rename + name-lock — students only */}
                            {(u.is_student || u.role === 'student' || (!u.role && !u.is_teacher && !u.is_admin && !u.is_super_admin)) && (
                              <StudentNameEditor
                                userId={u.id}
                                currentName={u.full_name}
                                nameLocked={u.name_locked}
                                onSaved={(newName, newLocked) =>
                                  setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, full_name: newName, name_locked: newLocked } : x))
                                }
                                onError={(msg) => onToast('error', msg)}
                              />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{u.email || '—'}</div>
                          {isBlocked && (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-rose-700" title={blocked.get(u.id) ?? undefined}>
                              <Ban className="w-3 h-3" /> Blocked{blocked.get(u.id) ? ` · ${blocked.get(u.id)}` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 sm:justify-end flex-wrap">
                          <span
                            className={`flex items-center gap-1 ${u.phone ? '' : 'text-amber-700 font-bold'}`}
                            title={u.phone ? 'Phone' : 'No phone number — this account cannot be given a course'}
                          >
                            <Phone className="w-3 h-3" />
                            {u.phone || 'no phone'}
                          </span>
                          <span title="Enrollments">{u.enrollment_count} enr.</span>
                          <span title="Joined">{formatDate(u.created_at)}</span>
                        </div>
                      </div>
                      <select
                        value={u.role || 'student'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as 'student' | 'teacher' | 'seller' | 'hr' | 'admin' | 'super_admin')}
                        disabled={busyUserId === u.id}
                        className="h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="seller">Seller</option>
                        {/* Elevated roles: super-admin only. If the user already
                            holds one, keep it visible so the dropdown reflects
                            their current role. */}
                        {(canManageStaff || u.role === 'hr') && <option value="hr">HR</option>}
                        {(canManageStaff || u.role === 'admin') && <option value="admin">Admin</option>}
                        {(canManageStaff || u.role === 'super_admin') && <option value="super_admin">Super Admin</option>}
                      </select>
                      {/* Sign in as user (impersonation) */}
                      <button
                        onClick={() => handleImpersonate(u.id, displayName)}
                        disabled={busyUserId === u.id}
                        title={`Sign in as ${displayName}`}
                        className="h-9 px-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        {busyUserId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <LogIn className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Sign in as</span>
                      </button>
                      {/* Block / unblock — super admins, never on another super admin. */}
                      {canManageStaff && u.role !== 'super_admin' && !u.is_super_admin && (
                        isBlocked ? (
                          <button
                            onClick={() => void setBlock(u.id, displayName, false)}
                            disabled={busyUserId === u.id}
                            title={`Unblock ${displayName}`}
                            className="h-9 px-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-grotesk)' }}
                          >
                            <LockOpen className="w-3 h-3" />
                            <span className="hidden sm:inline">Unblock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => { setConfirmBlockId(confirmBlockId === u.id ? null : u.id); setBlockReason(''); }}
                            disabled={busyUserId === u.id}
                            title={`Block ${displayName}`}
                            className="h-9 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-grotesk)' }}
                          >
                            <Ban className="w-3 h-3" />
                            <span className="hidden sm:inline">Block</span>
                          </button>
                        )
                      )}
                    </div>
                    {confirmBlockId === u.id && !isBlocked && (
                      <div className="mx-3 mb-3 rounded-lg border border-rose-200 bg-white p-3 space-y-2">
                        <p className="text-[12.5px] text-slate-700 leading-snug">
                          <strong className="text-slate-900">Block {displayName}?</strong> They are signed out and cannot sign in again,
                          by any method, until you unblock them. They will be told to check with support.
                        </p>
                        <input
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          maxLength={300}
                          placeholder="Reason, for the record (optional) — e.g. left the company"
                          className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-[13px] outline-none focus:border-rose-400"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void setBlock(u.id, displayName, true)}
                            disabled={busyUserId === u.id}
                            className="h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {busyUserId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />} Block account
                          </button>
                          <button onClick={() => setConfirmBlockId(null)} className="h-9 px-2 text-xs font-bold text-slate-500 hover:text-slate-800">Cancel</button>
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
