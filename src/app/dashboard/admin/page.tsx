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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
        <p className="text-gray-600">Overview of appointments, attendance, and trainer activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Total Appointments</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.stats.totalAppointments}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
          <p className="mt-2 text-3xl font-bold text-primary-600">{data.stats.completionRate}%</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">No-Show Rate</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{data.stats.noShowRate}%</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-600">Upcoming</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{data.stats.upcomingAppointments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Appointment Status</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">Workout Type Breakdown</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workoutBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Trainer Utilization (This Month)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Trainer</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Total Sessions</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Completed</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.trainerUtilization.map((t) => (
                <tr key={t.trainerId}>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.trainerName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.totalSessions}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.completedSessions}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {t.totalSessions > 0 ? Math.round((t.completedSessions / t.totalSessions) * 100) : 0}%
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
