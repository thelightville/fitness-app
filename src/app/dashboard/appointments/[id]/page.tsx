'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';
import { AppointmentStatus, UserRole, WorkoutType } from '@prisma/client';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import {
  CalendarDays,
  MapPin,
  User,
  Download,
  MapPinCheck,
  XCircle,
  UserX,
  Trophy,
  Clock,
  Activity,
  FileText,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface AppointmentDetail {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  rescheduleReason: string | null;
  client: { user: { name: string | null; email: string } };
  trainer: { user: { name: string | null; email: string } };
  gymLocation: {
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    checkInRadiusMeters: number;
  };
  workoutLog: {
    workoutType: WorkoutType;
    durationMinutes: number;
    intensity: number | null;
    notes: string | null;
    clientFeedback: string | null;
    exercises: { name: string; sets?: number; reps?: number; weight?: number }[];
  } | null;
  checkIns: {
    latitude: number;
    longitude: number;
    distanceMeters: number;
    verified: boolean;
    checkedInAt: string;
    deviceInfo: string | null;
  }[];
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [workoutForm, setWorkoutForm] = useState<{
    workoutType: WorkoutType;
    durationMinutes: number;
    intensity: number;
    notes: string;
    clientFeedback: string;
  }>({
    workoutType: WorkoutType.STRENGTH,
    durationMinutes: 60,
    intensity: 5,
    notes: '',
    clientFeedback: '',
  });

  const id = params.id as string;
  const isClient = session?.user?.role === UserRole.CLIENT;
  const isTrainer = session?.user?.role === UserRole.TRAINER;
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  useEffect(() => {
    fetchAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchAppointment() {
    setLoading(true);
    const res = await fetch(`/api/appointments/${id}`);
    const data = await res.json();
    setAppointment(data);
    setLoading(false);
  }

  async function updateStatus(status: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) fetchAppointment();
  }

  async function handleCheckIn() {
    setCheckInLoading(true);
    setMessage('');

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
      setCheckInLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const res = await fetch(`/api/appointments/${id}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage(
            data.verified
              ? `Check-in verified. Distance: ${Math.round(data.distanceMeters)}m`
              : `Check-in failed. You are ${Math.round(data.distanceMeters)}m from the gym.`
          );
          fetchAppointment();
        } else {
          setMessage(data.error || 'Check-in failed');
        }
        setCheckInLoading(false);
      },
      (err) => {
        setMessage(`Location error: ${err.message}`);
        setCheckInLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleManualCheckIn() {
    const reason = window.prompt('Reason for manual check-in override?');
    if (!reason) return;

    const res = await fetch(`/api/appointments/${id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 0, longitude: 0, manual: true, reason }),
    });

    if (res.ok) fetchAppointment();
  }

  async function handleWorkoutLog(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/appointments/${id}/workout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutForm),
    });

    if (res.ok) {
      fetchAppointment();
    } else {
      const data = await res.json();
      setMessage(data.error || 'Failed to log workout');
    }
  }

  function downloadCalendar() {
    window.open(`/api/appointments/${id}/calendar`, '_blank');
  }

  function canCancel(status: AppointmentStatus) {
    const cancellableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.RESCHEDULED,
    ];

    return cancellableStatuses.includes(status);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading appointment details..." />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500">Appointment not found.</p>
        <Link href="/dashboard/appointments" className="btn-secondary mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/appointments"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Back to appointments"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <PageHeader
          title="Appointment Details"
          action={
            <button onClick={downloadCalendar} className="btn-secondary">
              <Download className="h-4 w-4" aria-hidden="true" />
              Calendar Invite
            </button>
          }
        />
      </div>

      {message && (
        <div className="rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">{message}</div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Date & Time</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {format(parseISO(appointment.startsAt), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-slate-600">
                {format(parseISO(appointment.startsAt), 'h:mm a')} - {format(parseISO(appointment.endsAt), 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={appointment.status} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Client</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {appointment.client.user.name || appointment.client.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trainer</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {appointment.trainer.user.name || appointment.trainer.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">
                {appointment.gymLocation.name}
              </p>
              {appointment.gymLocation.address && (
                <p className="text-sm text-slate-600">{appointment.gymLocation.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          {!isClient && appointment.status === AppointmentStatus.PENDING && (
            <button onClick={() => updateStatus(AppointmentStatus.CONFIRMED)} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Confirm
            </button>
          )}
          {canCancel(appointment.status) && (
            <button onClick={() => updateStatus(AppointmentStatus.CANCELLED)} className="btn-danger">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Cancel
            </button>
          )}
          {appointment.status === AppointmentStatus.CONFIRMED && (
            <>
              {isClient && (
                <button onClick={handleCheckIn} disabled={checkInLoading} className="btn-primary">
                  <MapPinCheck className="h-4 w-4" aria-hidden="true" />
                  {checkInLoading ? 'Getting location...' : 'Check In at Gym'}
                </button>
              )}
              {(!isClient || isAdmin) && (
                <button onClick={handleManualCheckIn} className="btn-secondary">
                  <MapPinCheck className="h-4 w-4" aria-hidden="true" />
                  Manual Check-In
                </button>
              )}
              {(isTrainer || isAdmin) && (
                <button onClick={() => updateStatus(AppointmentStatus.NO_SHOW)} className="btn-secondary">
                  <UserX className="h-4 w-4" aria-hidden="true" />
                  Mark No-Show
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {appointment.checkIns.length > 0 && (
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <MapPinCheck className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Check-Ins
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {appointment.checkIns.map((ci, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 ${
                  ci.verified
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-red-200 bg-red-50/40'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {format(parseISO(ci.checkedInAt), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Distance: {ci.distanceMeters < 0 ? 'manual' : `${Math.round(ci.distanceMeters)}m`}
                </p>
                <p className={`mt-1 text-xs font-bold uppercase ${ci.verified ? 'text-emerald-700' : 'text-red-700'}`}>
                  {ci.verified ? 'Verified' : 'Not verified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isTrainer || isAdmin) && appointment.status !== AppointmentStatus.COMPLETED && (
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Log Workout
          </h2>
          <form onSubmit={handleWorkoutLog} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">Workout Type</label>
              <select
                value={workoutForm.workoutType}
                onChange={(e) => setWorkoutForm({ ...workoutForm, workoutType: e.target.value as unknown as WorkoutType })}
                className="input"
              >
                {Object.values(WorkoutType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                required
                min={1}
                value={workoutForm.durationMinutes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, durationMinutes: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Intensity (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={workoutForm.intensity}
                onChange={(e) => setWorkoutForm({ ...workoutForm, intensity: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />
                PT Notes
              </label>
              <textarea
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                className="input min-h-[100px]"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Client Feedback
              </label>
              <textarea
                value={workoutForm.clientFeedback}
                onChange={(e) => setWorkoutForm({ ...workoutForm, clientFeedback: e.target.value })}
                className="input min-h-[100px]"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Complete Session
              </button>
            </div>
          </form>
        </div>
      )}

      {appointment.workoutLog && (
        <div className="card">
          <h2 className="section-title flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Workout Log
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Type</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{appointment.workoutLog.workoutType}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Duration</p>
              <p className="mt-1 text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600" aria-hidden="true" />
                {appointment.workoutLog.durationMinutes} min
              </p>
            </div>
            {appointment.workoutLog.intensity && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Intensity</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{appointment.workoutLog.intensity}/10</p>
              </div>
            )}
            {appointment.workoutLog.notes && (
              <div className="sm:col-span-2 lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">PT Notes</p>
                <p className="mt-1 text-sm text-slate-700">{appointment.workoutLog.notes}</p>
              </div>
            )}
            {appointment.workoutLog.clientFeedback && (
              <div className="sm:col-span-2 lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Client Feedback</p>
                <p className="mt-1 text-sm text-slate-700">{appointment.workoutLog.clientFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
