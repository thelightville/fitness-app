'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Ruler,
  Weight,
  Activity,
  CalendarDays,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Measurement {
  id: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armsCm: number | null;
  notes: string | null;
  measuredAt: string;
  createdAt: string;
}

interface Client {
  id: string;
  user: { name: string | null; email: string };
}

export default function ClientMeasurementsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    weightKg: '',
    bodyFatPct: '',
    waistCm: '',
    chestCm: '',
    armsCm: '',
    notes: '',
    measuredAt: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [clientRes, measurementsRes] = await Promise.all([
      fetch(`/api/admin/users/${clientId}`),
      fetch(`/api/clients/${clientId}/measurements`),
    ]);

    if (clientRes.ok) {
      setClient(await clientRes.json());
    }
    if (measurementsRes.ok) {
      setMeasurements(await measurementsRes.json());
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetForm() {
    setForm({
      weightKg: '',
      bodyFatPct: '',
      waistCm: '',
      chestCm: '',
      armsCm: '',
      notes: '',
      measuredAt: format(new Date(), 'yyyy-MM-dd'),
    });
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload: Record<string, any> = {};
    if (form.weightKg) payload.weightKg = parseFloat(form.weightKg);
    if (form.bodyFatPct) payload.bodyFatPct = parseFloat(form.bodyFatPct);
    if (form.waistCm) payload.waistCm = parseFloat(form.waistCm);
    if (form.chestCm) payload.chestCm = parseFloat(form.chestCm);
    if (form.armsCm) payload.armsCm = parseFloat(form.armsCm);
    if (form.notes) payload.notes = form.notes;
    if (form.measuredAt) payload.measuredAt = new Date(form.measuredAt).toISOString();

    const res = await fetch(`/api/clients/${clientId}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save measurement');
      return;
    }

    setSuccess('Measurement recorded');
    resetForm();
    fetchData();
  }

  async function remove(measurementId: string) {
    if (!confirm('Delete this measurement?')) return;
    const res = await fetch(`/api/clients/${clientId}/measurements/${measurementId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSuccess('Measurement deleted');
      fetchData();
    } else {
      setError('Failed to delete measurement');
    }
  }

  const chartData = [...measurements]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((m) => ({
      date: format(parseISO(m.measuredAt), 'MMM d'),
      weight: m.weightKg ?? undefined,
      bodyFat: m.bodyFatPct ?? undefined,
    }));

  if (loading) return <Spinner label="Loading measurements..." />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Client Progress"
        subtitle={`Measurements and trends for ${client?.user?.name || client?.user?.email || 'client'}.`}
        action={
          <Link href="/dashboard/admin/clients" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to clients
          </Link>
        }
      />

      {showForm && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Add Measurement
            </h2>
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                className="input"
                placeholder="e.g. 75.5"
              />
            </div>
            <div>
              <label className="label">Body fat (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.bodyFatPct}
                onChange={(e) => setForm({ ...form, bodyFatPct: e.target.value })}
                className="input"
                placeholder="e.g. 18.5"
              />
            </div>
            <div>
              <label className="label">Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.waistCm}
                onChange={(e) => setForm({ ...form, waistCm: e.target.value })}
                className="input"
                placeholder="e.g. 82"
              />
            </div>
            <div>
              <label className="label">Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.chestCm}
                onChange={(e) => setForm({ ...form, chestCm: e.target.value })}
                className="input"
                placeholder="e.g. 102"
              />
            </div>
            <div>
              <label className="label">Arms (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.armsCm}
                onChange={(e) => setForm({ ...form, armsCm: e.target.value })}
                className="input"
                placeholder="e.g. 35"
              />
            </div>
            <div>
              <label className="label">Date measured</label>
              <input
                type="date"
                required
                value={form.measuredAt}
                onChange={(e) => setForm({ ...form, measuredAt: e.target.value })}
                className="input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                rows={3}
                placeholder="Optional context, e.g. post-holiday check-in"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" className="btn-primary">
                Save Measurement
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Measurement History
          </h2>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Measurement
          </button>
        </div>
      )}

      {!showForm && success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      {measurements.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="No measurements yet"
          description="Record the first measurement to start tracking this client's progress."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Measurement
            </button>
          }
        />
      ) : (
        <>
          {chartData.some((d) => d.weight) && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Weight trend
              </h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card overflow-hidden p-0">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Weight</th>
                  <th className="table-header">Body Fat</th>
                  <th className="table-header">Waist</th>
                  <th className="table-header">Chest</th>
                  <th className="table-header">Arms</th>
                  <th className="table-header">Notes</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                    <td className="table-cell whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {format(parseISO(m.measuredAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell dark:text-slate-300">
                      {m.weightKg ? `${m.weightKg} kg` : '—'}
                    </td>
                    <td className="table-cell dark:text-slate-300">
                      {m.bodyFatPct ? `${m.bodyFatPct}%` : '—'}
                    </td>
                    <td className="table-cell dark:text-slate-300">
                      {m.waistCm ? `${m.waistCm} cm` : '—'}
                    </td>
                    <td className="table-cell dark:text-slate-300">
                      {m.chestCm ? `${m.chestCm} cm` : '—'}
                    </td>
                    <td className="table-cell dark:text-slate-300">
                      {m.armsCm ? `${m.armsCm} cm` : '—'}
                    </td>
                    <td className="table-cell max-w-xs truncate dark:text-slate-300">
                      {m.notes || '—'}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => remove(m.id)}
                        className="btn-ghost p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label="Delete measurement"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
