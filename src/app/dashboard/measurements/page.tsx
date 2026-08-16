'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Ruler, TrendingUp, CalendarDays, Weight, Activity } from 'lucide-react';
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
}

export default function ClientProgressPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/measurements')
      .then((r) => r.json())
      .then((data) => {
        setMeasurements(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const latest = measurements[0];

  const chartData = [...measurements]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((m) => ({
      date: format(parseISO(m.measuredAt), 'MMM d'),
      weight: m.weightKg ?? undefined,
      bodyFat: m.bodyFatPct ?? undefined,
      waist: m.waistCm ?? undefined,
    }));

  if (loading) return <Spinner label="Loading your progress..." />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Your Progress"
        subtitle="Track your measurements and see how your fitness journey is progressing."
      />

      {measurements.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="No measurements yet"
          description="Your trainer will record measurements here after your check-ins."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Latest weight</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {latest.weightKg ? `${latest.weightKg} kg` : '—'}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Body fat</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {latest.bodyFatPct ? `${latest.bodyFatPct}%` : '—'}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Waist</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {latest.waistCm ? `${latest.waistCm} cm` : '—'}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last measured</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {format(parseISO(latest.measuredAt), 'MMM d')}
              </p>
            </div>
          </div>

          {chartData.some((d) => d.weight) && (
            <div className="card">
              <h2 className="section-title flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" aria-hidden="true" />
                Trends
              </h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bodyFat"
                      name="Body fat (%)"
                      stroke="#22c55e"
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
