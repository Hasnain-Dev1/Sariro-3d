'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, X, Loader2, Users, Phone, LogIn,
} from 'lucide-react';
import {
  fetchUsers, updateUserRole, exportUsersCSV,
  type UserRow,
} from '@/lib/dashboard/admin-data';

/* ════════════════════════════════════════════════════════════════════════
   UserManagementModal — shared between admin + super-admin dashboards
   Features:
   - Search by name/email
   - Filter by role
   - Change user role (dropdown)
   - Sign in as user (impersonation)
   - Export CSV
   ════════════════════════════════════════════════════════════════════════ */

export function UserManagementModal({
  open, onClose, onToast,
}: {
  open: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

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
    newRole: 'student' | 'teacher' | 'admin' | 'super_admin'
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
        is_admin: newRole === 'admin',
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
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div
                        className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                            {displayName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{u.email || '—'}</div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 sm:justify-end flex-wrap">
                          <span className="flex items-center gap-1" title="Phone">
                            <Phone className="w-3 h-3" />
                            {u.phone || '—'}
                          </span>
                          <span title="Enrollments">{u.enrollment_count} enr.</span>
                          <span title="Joined">{formatDate(u.created_at)}</span>
                        </div>
                      </div>
                      <select
                        value={u.role || 'student'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as 'student' | 'teacher' | 'admin' | 'super_admin')}
                        disabled={busyUserId === u.id}
                        className="h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="seller">Seller</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
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
