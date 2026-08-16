'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Key, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to change password');
      return;
    }

    setSuccess('Password changed successfully');
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Manage your account security and preferences."
      />

      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary-600" aria-hidden="true" />
          Change Password
        </h2>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Current password</label>
            <div className="relative mt-1">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New password</label>
            <div className="relative mt-1">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <Key className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
