'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { MapPin, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  checkInRadiusMeters: number;
  active: boolean;
  createdAt: string;
}

export default function AdminGymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Gym | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    checkInRadiusMeters: 150,
    active: true,
  });

  useEffect(() => {
    fetchGyms();
  }, []);

  async function fetchGyms() {
    setLoading(true);
    const res = await fetch('/api/admin/gyms');
    const data = await res.json();
    setGyms(data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: '', address: '', latitude: '', longitude: '', checkInRadiusMeters: 150, active: true });
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(gym: Gym) {
    setEditing(gym);
    setForm({
      name: gym.name,
      address: gym.address || '',
      latitude: gym.latitude.toString(),
      longitude: gym.longitude.toString(),
      checkInRadiusMeters: gym.checkInRadiusMeters,
      active: gym.active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
    };

    if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      setError('Latitude and longitude must be valid numbers');
      return;
    }

    const url = editing ? `/api/admin/gyms/${editing.id}` : '/api/admin/gyms';
    const method = editing ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save gym');
      return;
    }

    setSuccess(editing ? 'Gym updated' : 'Gym created');
    resetForm();
    fetchGyms();
  }

  async function remove(id: string) {
    if (!confirm('Delete this gym? If it has linked appointments it will be deactivated instead.')) return;
    const res = await fetch(`/api/admin/gyms/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      setSuccess(data.deactivated ? 'Gym deactivated (has appointments)' : 'Gym deleted');
      fetchGyms();
    } else {
      setError('Failed to delete gym');
    }
  }

  if (loading) return <Spinner label="Loading gyms..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manage Gyms"
        subtitle="View, add, edit, and remove gym locations and check-in radius."
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Gym
          </button>
        }
      />

      {showForm && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">{editing ? 'Edit Gym' : 'Add Gym'}</h2>
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
            <div className="sm:col-span-2">
              <label className="label">Gym name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Check-in radius (meters)</label>
              <input
                type="number"
                min={10}
                max={2000}
                required
                value={form.checkInRadiusMeters}
                onChange={(e) => setForm({ ...form, checkInRadiusMeters: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div className="flex items-center gap-2">
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
                {editing ? 'Update Gym' : 'Create Gym'}
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

      {gyms.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No gyms yet"
          description="Get started by adding your first gym location."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Gym
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gyms.map((gym) => (
            <div key={gym.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{gym.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{gym.address || 'No address'}</p>
                </div>
                <span
                  className={`badge ${gym.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                >
                  {gym.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>Lat: {gym.latitude}</p>
                <p>Lng: {gym.longitude}</p>
                <p>Radius: {gym.checkInRadiusMeters}m</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => startEdit(gym)} className="btn-ghost p-2">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button onClick={() => remove(gym.id)} className="btn-ghost p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
