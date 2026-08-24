'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays, MapPin, Eye, CheckCircle2, XCircle, Plus, User } from 'lucide-react';

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

interface Client {
  id: string;
  user: { name: string | null; email: string };
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
  const [clients, setClients] = useState<Client[]>([]);
  const [gyms, setGyms] = useState<GymLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    clientId: '',
    trainerId: '',
    gymLocationId: '',
    date: '',
    time: '',
    duration: 60,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isClient = (session?.user as any)?.role === UserRole.CLIENT;
  const isTrainer = (session?.user as any)?.role === UserRole.TRAINER;
  const canBookSessions = isClient || isTrainer;

  useEffect(() => {
    fetchAppointments();
    if (isClient) {
      fetch('/api/trainers')
        .then((r) => r.json())
        .then(setTrainers);
    }
    if (isTrainer) {
      fetch('/api/clients')
        .then((r) => r.json())
        .then(setClients)
        .catch(() => setClients([]));
    }
    if (canBookSessions) {
      fetch('/api/gyms')
        .then((r) => r.json())
        .then(setGyms)
        .catch(() => setGyms([]));
    }
  }, [canBookSessions, isClient, isTrainer]);

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
    const payload = {
      ...(isClient ? { trainerId: form.trainerId } : {}),
      ...(isTrainer ? { clientId: form.clientId } : {}),
      gymLocationId: form.gymLocationId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to book appointment');
      return;
    }

    setSuccess('Session booked successfully');
    setForm({ clientId: '', trainerId: '', gymLocationId: '', date: '', time: '', duration: 60 });
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

  function canCancel(status: AppointmentStatus) {
    const cancellableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.RESCHEDULED,
    ];

    return cancellableStatuses.includes(status);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Appointments"
        subtitle="Schedule, manage, and track your training sessions."
      />

      {canBookSessions && (
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary-600" aria-hidden="true" />
            {isTrainer ? 'Book Client Session' : 'Book a Session'}
          </h2>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {isClient && (
              <div>
                <label className="label">Trainer</label>
                <select
                  required
                  value={form.trainerId}
                  onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                  className="input"
                >
                  <option value="">Select trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name || t.user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isTrainer && (
              <div>
                <label className="label">Client</label>
                <select
                  required
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="input"
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.user.name || c.user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">Gym</label>
              <select
                required
                value={form.gymLocationId}
                onChange={(e) => setForm({ ...form, gymLocationId: e.target.value })}
                className="input"
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
                className="input"
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Book Session
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary-600" aria-hidden="true" />
          Your Appointments
        </h2>
        {loading ? (
          <div className="mt-6 flex justify-center py-8">
            <Spinner label="Loading appointments..." />
          </div>
        ) : appointments.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CalendarDays}
              title="No appointments found"
              description={isTrainer ? 'Book a client session to see it here.' : 'Book your first session to see it here.'}
            />
          </div>
        ) : (
          <div className="mt-4 -mx-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">{isClient ? 'Trainer' : 'Client'}</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-medium text-slate-900">
                      {format(parseISO(appt.startsAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        {isClient
                          ? appt.trainer.user.name || appt.trainer.user.email
                          : appt.client.user.name || appt.client.user.email}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {appt.gymLocation.name}
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/dashboard/appointments/${appt.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                        {!isClient && appt.status === AppointmentStatus.PENDING && (
                          <button
                            onClick={() => updateStatus(appt.id, AppointmentStatus.CONFIRMED)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            Confirm
                          </button>
                        )}
                        {canCancel(appt.status) && (
                          <button
                            onClick={() => updateStatus(appt.id, AppointmentStatus.CANCELLED)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
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
