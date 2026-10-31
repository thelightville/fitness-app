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
  Plus,
  Trash2,
  Pencil,
  Save,
} from 'lucide-react';
import Link from 'next/link';

interface ExerciseSummary {
  id: string;
  name: string;
  category: string;
  primaryMuscleGroup: string | null;
  equipment: string | null;
  measurementType: string;
}

interface ExerciseRowForm {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  rpe: number;
  coachNotes: string;
}

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
    workoutExercises: {
      id: string;
      blockName: string | null;
      coachNotes: string | null;
      exercise: ExerciseSummary;
      sets: {
        id: string;
        setIndex: number;
        reps: number | null;
        weightKg: number | null;
        durationSeconds: number | null;
        distanceMeters: number | null;
        restSeconds: number | null;
        rpe: number | null;
        completed: boolean;
        notes: string | null;
      }[];
    }[];
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
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', duration: 60 });
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseSummary[]>([]);
  const [exerciseRows, setExerciseRows] = useState<ExerciseRowForm[]>([
    { exerciseId: '', name: '', sets: 3, reps: 10, weightKg: 0, rpe: 7, coachNotes: '' },
  ]);
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

  useEffect(() => {
    if (isTrainer || isAdmin) {
      fetch('/api/exercises')
        .then((res) => res.json())
        .then(setExerciseLibrary)
        .catch(() => setExerciseLibrary([]));
    }
  }, [isAdmin, isTrainer]);

  async function fetchAppointment() {
    setLoading(true);
    const res = await fetch(`/api/appointments/${id}`);
    const data = await res.json();
    setAppointment(data);
    setScheduleFormFromAppointment(data);
    setLoading(false);
  }

  /** Hydrates the edit form from the appointment's current schedule. */
  function setScheduleFormFromAppointment(nextAppointment: AppointmentDetail) {
    const startsAt = parseISO(nextAppointment.startsAt);
    const endsAt = parseISO(nextAppointment.endsAt);
    setScheduleForm({
      date: format(startsAt, 'yyyy-MM-dd'),
      time: format(startsAt, 'HH:mm'),
      duration: Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)),
    });
  }

  async function updateStatus(status: AppointmentStatus) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) fetchAppointment();
  }

  /** Saves a schedule edit while preserving the appointment's current status. */
  async function handleScheduleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment) return;

    setMessage('');
    const startsAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
    const endsAt = new Date(startsAt.getTime() + scheduleForm.duration * 60000);

    if (Number.isNaN(startsAt.getTime()) || scheduleForm.duration < 15) {
      setMessage('Choose a valid date, time, and duration of at least 15 minutes.');
      return;
    }

    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: appointment.status,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        rescheduleReason: 'Schedule updated from appointment details',
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setAppointment(data);
      setScheduleFormFromAppointment(data);
      setEditingSchedule(false);
      setMessage('Appointment schedule updated.');
    } else {
      setMessage(data.error || 'Failed to update appointment schedule');
    }
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
    const structuredExercises = exerciseRows
      .filter((row) => row.exerciseId || row.name.trim())
      .map((row) => ({
        exerciseId: row.exerciseId || undefined,
        name: row.exerciseId ? undefined : row.name.trim(),
        coachNotes: row.coachNotes.trim() || undefined,
        sets: Array.from({ length: row.sets }, () => ({
          reps: row.reps || undefined,
          weightKg: row.weightKg || undefined,
          rpe: row.rpe || undefined,
        })),
      }));

    const res = await fetch(`/api/appointments/${id}/workout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...workoutForm, structuredExercises }),
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

  /** Limits schedule edits to appointments that are still operationally active. */
  function canEditSchedule(status: AppointmentStatus) {
    const editableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.RESCHEDULED,
    ];

    return editableStatuses.includes(status);
  }

  function updateExerciseRow(index: number, patch: Partial<ExerciseRowForm>) {
    setExerciseRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addExerciseRow() {
    setExerciseRows((rows) => [...rows, { exerciseId: '', name: '', sets: 3, reps: 10, weightKg: 0, rpe: 7, coachNotes: '' }]);
  }

  function removeExerciseRow(index: number) {
    setExerciseRows((rows) => rows.length === 1 ? rows : rows.filter((_, rowIndex) => rowIndex !== index));
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
          {canEditSchedule(appointment.status) && (
            <button onClick={() => setEditingSchedule((value) => !value)} className="btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {editingSchedule ? 'Close Edit' : 'Edit Schedule'}
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

        {editingSchedule && canEditSchedule(appointment.status) && (
          <form onSubmit={handleScheduleUpdate} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-brand-line bg-brand-paper/70 p-4 sm:grid-cols-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                required
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <input
                type="number"
                min="15"
                step="15"
                required
                value={scheduleForm.duration}
                onChange={(e) => setScheduleForm({ ...scheduleForm, duration: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Changes
              </button>
            </div>
          </form>
        )}
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
              <div className="w-full rounded-lg border border-ink-900/10 bg-[#fafaf4] p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-black text-ink-900 dark:text-white">Specific exercises</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Record the movement, sets, reps, load, and effort for this session.</p>
                  </div>
                  <button type="button" onClick={addExerciseRow} className="btn-secondary">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add exercise
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {exerciseRows.map((row, index) => (
                    <div key={index} className="grid gap-3 rounded-lg bg-white p-3 ring-1 ring-ink-900/10 dark:bg-ink-900 dark:ring-white/10 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className="label">Exercise</label>
                        <select
                          value={row.exerciseId}
                          onChange={(e) => updateExerciseRow(index, { exerciseId: e.target.value, name: '' })}
                          className="input"
                        >
                          <option value="">Custom exercise</option>
                          {exerciseLibrary.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                          ))}
                        </select>
                        {!row.exerciseId && (
                          <input
                            value={row.name}
                            onChange={(e) => updateExerciseRow(index, { name: e.target.value })}
                            placeholder="Exercise name"
                            className="input mt-2"
                          />
                        )}
                      </div>
                      <div>
                        <label className="label">Sets</label>
                        <input type="number" min={1} max={20} value={row.sets} onChange={(e) => updateExerciseRow(index, { sets: Number(e.target.value) })} className="input" />
                      </div>
                      <div>
                        <label className="label">Reps</label>
                        <input type="number" min={0} value={row.reps} onChange={(e) => updateExerciseRow(index, { reps: Number(e.target.value) })} className="input" />
                      </div>
                      <div>
                        <label className="label">Load kg</label>
                        <input type="number" min={0} step="0.5" value={row.weightKg} onChange={(e) => updateExerciseRow(index, { weightKg: Number(e.target.value) })} className="input" />
                      </div>
                      <div>
                        <label className="label">RPE</label>
                        <div className="flex gap-2">
                          <input type="number" min={1} max={10} value={row.rpe} onChange={(e) => updateExerciseRow(index, { rpe: Number(e.target.value) })} className="input" />
                          <button type="button" onClick={() => removeExerciseRow(index)} className="rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50" aria-label="Remove exercise">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-6">
                        <label className="label">Coach notes for this exercise</label>
                        <input value={row.coachNotes} onChange={(e) => updateExerciseRow(index, { coachNotes: e.target.value })} placeholder="Tempo, form cues, modifications, or targets" className="input" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
            {appointment.workoutLog.workoutExercises.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Exercises completed</p>
                <div className="mt-3 space-y-3">
                  {appointment.workoutLog.workoutExercises.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-ink-900/10 bg-[#fafaf4] p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg font-black text-ink-900 dark:text-white">{entry.exercise.name}</p>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {[entry.exercise.primaryMuscleGroup, entry.exercise.equipment, entry.blockName].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className="rounded-lg bg-primary-300 px-2 py-1 text-xs font-black uppercase text-ink-900">{entry.exercise.category}</span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {entry.sets.map((set) => (
                          <div key={set.id} className="rounded-lg bg-white p-3 text-sm ring-1 ring-ink-900/10 dark:bg-ink-900 dark:ring-white/10">
                            <p className="font-black text-ink-900 dark:text-white">Set {set.setIndex + 1}</p>
                            <p className="mt-1 font-semibold text-slate-600 dark:text-slate-300">
                              {set.reps ?? '--'} reps {set.weightKg ? `· ${set.weightKg}kg` : ''} {set.rpe ? `· RPE ${set.rpe}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                      {entry.coachNotes && <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{entry.coachNotes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
