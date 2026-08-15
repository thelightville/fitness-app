'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@prisma/client';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  client: { id: string; active: boolean } | null;
}

export default function AdminClientsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    goals: '',
    active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.filter((u: User) => u.role === UserRole.CLIENT));
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: '', email: '', phone: '', password: '', goals: '', active: true });
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(user: User) {
    setEditing(user);
    setForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      password: '',
      goals: '',
      active: user.client?.active ?? true,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = { ...form, role: UserRole.CLIENT };
    if (!editing && !payload.password) {
      setError('Password is required for new users');
      return;
    }

    const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users';
    const method = editing ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save client');
      return;
    }

    setSuccess(editing ? 'Client updated' : 'Client created');
    resetForm();
    fetchUsers();
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this client? They will no longer be able to log in.')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Client deactivated');
      fetchUsers();
    } else {
      setError('Failed to deactivate client');
    }
  }

  if (loading) return <Spinner label="Loading clients..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manage Clients"
        subtitle="View, add, edit, and deactivate client accounts."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Client
          </button>
        }
      />

      {showForm && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">{editing ? 'Edit Client' : 'Add Client'}</h2>
            <button onClick={resetForm} className="btn-ghost">
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              <label className="label">Password {editing && '(leave blank to keep)'}</label>
              <input
                type="password"
                required={!editing}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder={editing ? '••••••••' : 'At least 8 characters'}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Goals</label>
              <textarea
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Active
              </label>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary">
                {editing ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Get started by adding your first client."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Client
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
                <th className="table-header">Status</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                  <td className="table-cell font-medium text-slate-900 dark:text-slate-100">{user.name || '—'}</td>
                  <td className="table-cell dark:text-slate-300">{user.email}</td>
                  <td className="table-cell dark:text-slate-300">{user.phone || '—'}</td>
                  <td className="table-cell">
                    <span
                      className={`badge ${user.client?.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                    >
                      {user.client?.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell dark:text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(user)} className="btn-ghost p-2">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button onClick={() => deactivate(user.id)} className="btn-ghost p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
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
