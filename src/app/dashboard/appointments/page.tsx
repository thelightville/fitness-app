'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';
import { AppointmentStatus, UserRole } from '@prisma/client';

interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  client: { user: { name: string | null; email: string } };
  trainer: { user: { name: string | null; email: string } };
  gymLocation: { name: string; address: string | null };
}

interface Trainer {
  id: string;
  user: { name: string | null; email: string };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface GymLocation {
  id: string;
  name: string;
  address: string | null;
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [gyms, setGyms] = useState<GymLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    trainerId: '',
    gymLocationId: '',
    date: '',
    time: '',
    duration: 60,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isClient = (session?.user as any)?.role === UserRole.CLIENT;

  useEffect(() => {
    fetchAppointments();
    if (isClient) {
      fetch('/api/trainers')
        .then((r) => r.json())
        .then(setTrainers);
      fetch('/api/gyms')
        .then((r) => r.json())
        .then(setGyms)
        .catch(() => setGyms([]));
    }
  }, [isClient]);

  async function fetchAppointments() {
    setLoading(true);
    const res = await fetch('/api/appointments?limit=100');
    const data = await res.json();
    setAppointments(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const startsAt = new Date(`${form.date}T${form.time}`);
    const endsAt = new Date(startsAt.getTime() + form.duration * 60000);

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerId: form.trainerId,
        gymLocationId: form.gymLocationId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to book appointment');
      return;
    }

    setSuccess('Appointment booked successfully');
    setForm({ trainerId: '', gymLocationId: '', date: '', time: '', duration: 60 });
    fetchAppointments();
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) fetchAppointments();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
      </div>

      {isClient && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Book a Session</h2>
          {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label">Trainer</label>
              <select
                required
                value={form.trainerId}
                onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                className="input mt-1"
              >
                <option value="">Select trainer</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name || t.user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gym</label>
              <select
                required
                value={form.gymLocationId}
                onChange={(e) => setForm({ ...form, gymLocationId: e.target.value })}
                className="input mt-1"
              >
                <option value="">Select gym</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                Book Session
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Your Appointments</h2>
        {loading ? (
          <p className="mt-4 text-gray-500">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="mt-4 text-gray-500">No appointments found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date & Time</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                    {isClient ? 'Trainer' : 'Client'}
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Location</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {format(parseISO(appt.startsAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {isClient
                        ? appt.trainer.user.name || appt.trainer.user.email
                        : appt.client.user.name || appt.client.user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{appt.gymLocation.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/appointments/${appt.id}`} className="text-primary-600 hover:text-primary-500">
                          View
                        </Link>
                        {!isClient && appt.status === AppointmentStatus.PENDING && (
                          <button
                            onClick={() => updateStatus(appt.id, AppointmentStatus.CONFIRMED)}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === AppointmentStatus.CONFIRMED && (
                          <button
                            onClick={() => updateStatus(appt.id, AppointmentStatus.CANCELLED)}
                            className="text-red-600 hover:text-red-500"
                          >
                            Cancel
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
    </div>
  );
}
