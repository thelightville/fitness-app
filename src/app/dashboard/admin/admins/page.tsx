'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  User,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminManagementPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReset, setShowReset] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [resetForm, setResetForm] = useState({ password: '' });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/admins');
    if (res.ok) {
      setAdmins(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  function resetCreateForm() {
    setForm({ name: '', email: '', phone: '', password: '' });
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create admin');
      return;
    }

    setSuccess('Admin created successfully');
    resetCreateForm();
    fetchAdmins();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!showReset) return;

    const res = await fetch('/api/admin/admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: showReset.id, password: resetForm.password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to reset password');
      return;
    }

    setSuccess(`Password reset for ${showReset.email}`);
    setShowReset(null);
    setResetForm({ password: '' });
    fetchAdmins();
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this admin? They will no longer be able to log in.')) return;
    const res = await fetch(`/api/admin/admins?userId=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Admin deactivated');
      fetchAdmins();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to deactivate admin');
    }
  }

  if (loading) return <Spinner label="Loading admins..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manage Admins"
        subtitle="Create, reset passwords, and deactivate administrator accounts."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Admin
          </button>
        }
      />

      {showForm && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Add Admin
            </h2>
            <button onClick={resetCreateForm} className="btn-ghost">
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
          </div>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {success}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="+1 416 555 0199"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder="At least 8 characters"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">
                Create Admin
              </button>
            </div>
          </form>
        </div>
      )}

      {showReset && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Reset Password
            </h2>
            <button
              onClick={() => {
                setShowReset(null);
                setResetForm({ password: '' });
              }}
              className="btn-ghost"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
          </div>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {success}
            </div>
          )}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Resetting password for <strong>{showReset.email}</strong>.
          </p>
          <form onSubmit={handleReset} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={resetForm.password}
                onChange={(e) => setResetForm({ password: e.target.value })}
                className="input"
                placeholder="At least 8 characters"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && !showReset && success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      {!showForm && !showReset && error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </div>
      )}

      {admins.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No admins found"
          description="Create the first admin account to manage the system."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Admin
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Last updated</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                  <td className="table-cell font-medium text-slate-900 dark:text-slate-100">
                    {admin.name || '—'}
                  </td>
                  <td className="table-cell dark:text-slate-300">{admin.email}</td>
                  <td className="table-cell dark:text-slate-300">{admin.phone || '—'}</td>
                  <td className="table-cell dark:text-slate-300">
                    {new Date(admin.updatedAt).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowReset(admin)}
                        className="btn-ghost p-2"
                        aria-label="Reset password"
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {session?.user?.id !== admin.id && (
                        <button
                          onClick={() => deactivate(admin.id)}
                          className="btn-ghost p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Deactivate admin"
                          title="Deactivate admin"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
