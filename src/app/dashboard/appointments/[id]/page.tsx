'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';
import { AppointmentStatus, UserRole, WorkoutType } from '@prisma/client';

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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!appointment) return <p className="text-gray-500">Appointment not found.</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
        <button onClick={downloadCalendar} className="btn-secondary">
          Download Calendar Invite
        </button>
      </div>

      {message && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">{message}</div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Date & Time</p>
            <p className="text-lg font-medium text-gray-900">
              {format(parseISO(appointment.startsAt), 'EEEE, MMMM d, yyyy h:mm a')} -{' '}
              {format(parseISO(appointment.endsAt), 'h:mm a')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium text-gray-900">
              {appointment.client.user.name || appointment.client.user.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trainer</p>
            <p className="font-medium text-gray-900">
              {appointment.trainer.user.name || appointment.trainer.user.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900">
              {appointment.gymLocation.name}
              {appointment.gymLocation.address && `, ${appointment.gymLocation.address}`}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!isClient && appointment.status === AppointmentStatus.PENDING && (
            <button onClick={() => updateStatus(AppointmentStatus.CONFIRMED)} className="btn-primary">
              Confirm
            </button>
          )}
          {appointment.status === AppointmentStatus.CONFIRMED && (
            <>
              {isClient && (
                <button onClick={handleCheckIn} disabled={checkInLoading} className="btn-primary">
                  {checkInLoading ? 'Getting location...' : 'Check In at Gym'}
                </button>
              )}
              {(!isClient || isAdmin) && (
                <button onClick={handleManualCheckIn} className="btn-secondary">
                  Manual Check-In
                </button>
              )}
              <button onClick={() => updateStatus(AppointmentStatus.CANCELLED)} className="btn-danger">
                Cancel
              </button>
              <button onClick={() => updateStatus(AppointmentStatus.NO_SHOW)} className="btn-secondary">
                Mark No-Show
              </button>
            </>
          )}
        </div>
      </div>

      {appointment.checkIns.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Check-Ins</h2>
          <div className="mt-4 space-y-3">
            {appointment.checkIns.map((ci, idx) => (
              <div key={idx} className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm text-gray-600">
                  {format(parseISO(ci.checkedInAt), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-sm text-gray-600">
                  Distance: {ci.distanceMeters < 0 ? 'manual' : `${Math.round(ci.distanceMeters)}m`} ·{' '}
                  {ci.verified ? 'Verified' : 'Not verified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(isTrainer || isAdmin) && appointment.status !== AppointmentStatus.COMPLETED && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Log Workout</h2>
          <form onSubmit={handleWorkoutLog} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Workout Type</label>
              <select
                value={workoutForm.workoutType}
                onChange={(e) => setWorkoutForm({ ...workoutForm, workoutType: e.target.value as unknown as WorkoutType })}
                className="input mt-1"
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
                className="input mt-1"
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
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">PT Notes</label>
              <textarea
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Client Feedback</label>
              <textarea
                value={workoutForm.clientFeedback}
                onChange={(e) => setWorkoutForm({ ...workoutForm, clientFeedback: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                Complete Session
              </button>
            </div>
          </form>
        </div>
      )}

      {appointment.workoutLog && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Workout Log</h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Type:</span> {appointment.workoutLog.workoutType}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Duration:</span> {appointment.workoutLog.durationMinutes} minutes
            </p>
            {appointment.workoutLog.intensity && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Intensity:</span> {appointment.workoutLog.intensity}/10
              </p>
            )}
            {appointment.workoutLog.notes && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {appointment.workoutLog.notes}
              </p>
            )}
            {appointment.workoutLog.clientFeedback && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Client Feedback:</span> {appointment.workoutLog.clientFeedback}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
