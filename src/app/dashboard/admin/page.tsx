'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { WorkoutType } from '@prisma/client';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { CalendarDays, CheckCircle2, UserX, Clock, BarChart3, Users, Activity, MapPin, Dumbbell, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    upcomingAppointments: number;
    completionRate: number;
    noShowRate: number;
  };
  workoutBreakdown: { type: WorkoutType; count: number }[];
  trainerUtilization: {
    trainerId: string;
    trainerName: string | null;
    totalSessions: number;
    completedSessions: number;
  }[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-gray-500">Loading analytics...</p>;
  if (!data) return <p className="text-gray-500">Failed to load analytics.</p>;

  const statusData = [
    { name: 'Completed', value: data.stats.completedAppointments },
    { name: 'Cancelled', value: data.stats.cancelledAppointments },
    { name: 'No-Show', value: data.stats.noShowAppointments },
    { name: 'Upcoming', value: data.stats.upcomingAppointments },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Admin Analytics"
        subtitle="Overview of appointments, attendance, and trainer activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/admin/clients"
          className="card card-hover group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Manage Clients</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add, edit, deactivate</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" aria-hidden="true" />
        </Link>
        <Link
          href="/dashboard/admin/trainers"
          className="card card-hover group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-400">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Manage Trainers</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Profiles & specialties</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" aria-hidden="true" />
        </Link>
        <Link
          href="/dashboard/admin/gyms"
          className="card card-hover group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600 group-hover:bg-orange-600 group-hover:text-white dark:bg-orange-900/30 dark:text-orange-400">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Manage Gyms</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Locations & check-in radius</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Appointments"
          value={data.stats.totalAppointments}
          icon={CalendarDays}
          color="slate"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.stats.completionRate}%`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="No-Show Rate"
          value={`${data.stats.noShowRate}%`}
          icon={UserX}
          color="red"
        />
        <StatCard
          label="Upcoming"
          value={data.stats.upcomingAppointments}
          icon={Clock}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Appointment Status
          </h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Workout Type Breakdown
          </h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workoutBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
          Trainer Utilization (This Month)
        </h2>
        <div className="mt-4 -mx-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="table-header">Trainer</th>
                <th className="table-header">Total Sessions</th>
                <th className="table-header">Completed</th>
                <th className="table-header">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.trainerUtilization.map((t) => (
                <tr key={t.trainerId} className="hover:bg-slate-50/60">
                  <td className="table-cell font-medium text-slate-900">{t.trainerName || 'Unknown'}</td>
                  <td className="table-cell">{t.totalSessions}</td>
                  <td className="table-cell">{t.completedSessions}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{
                            width: `${t.totalSessions > 0 ? Math.round((t.completedSessions / t.totalSessions) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {t.totalSessions > 0 ? Math.round((t.completedSessions / t.totalSessions) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
