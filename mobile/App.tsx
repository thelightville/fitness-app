import Geolocation from '@react-native-community/geolocation';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://fitness.myapps.com.ng';
const SESSION_SERVICE = 'fitness-mobile-session';
const queryClient = new QueryClient();

const VISUALS = {
  login: require('./assets/studio-session.png'),
  coach: require('./assets/coach-session.png'),
  trainer: require('./assets/trainer-dashboard.png'),
  progress: require('./assets/progress-check.png'),
};

type UserRole = 'CLIENT' | 'TRAINER' | 'ADMIN';
type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW';
type WorkoutType = 'STRENGTH' | 'CARDIO' | 'MOBILITY' | 'HIIT' | 'ENDURANCE' | 'REHABILITATION' | 'ASSESSMENT' | 'CUSTOM';
type ActiveView = 'appointments' | 'progress';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

interface MobileSession {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt?: string;
  user: UserProfile;
}

interface DashboardData {
  user: UserProfile;
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    upcomingAppointments: number;
    completionRate: number;
    noShowRate: number;
  };
  appointments: Appointment[];
}

interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  client: { id: string; user: { name: string | null; email: string } };
  trainer: { id: string; user: { name: string | null; email: string } };
  gymLocation: { name: string; address: string | null; latitude: number; longitude: number; checkInRadiusMeters: number };
  workoutLog?: WorkoutLog | null;
}

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

interface WorkoutLog {
  id: string;
  workoutType: WorkoutType;
  durationMinutes: number;
  intensity: number | null;
  notes: string | null;
  clientFeedback?: string | null;
  completedAt: string;
  appointment?: {
    startsAt: string;
    trainer: { user: { name: string | null; email: string } };
    gymLocation: { name: string };
  };
}

interface WorkoutPayload {
  workoutType: WorkoutType;
  durationMinutes: number;
  intensity?: number;
  notes?: string;
}

interface ProgressData {
  client: { id: string; name: string | null; email: string };
  latestMeasurement: Measurement | null;
  measurements: Measurement[];
  workoutLogs: WorkoutLog[];
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="light-content" />
      <MobileApp />
    </QueryClientProvider>
  );
}

/** Persists mobile session data in the native secure store. */
async function saveSession(session: MobileSession) {
  await Keychain.setGenericPassword(session.user.email, JSON.stringify(session), { service: SESSION_SERVICE });
}

/** Reads the saved native session, returning null when none exists. */
async function loadSession(): Promise<MobileSession | null> {
  const credentials = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
  if (!credentials) return null;
  return JSON.parse(credentials.password) as MobileSession;
}

/** Removes the saved native session from Keychain or Keystore. */
async function clearSession() {
  await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
}

/** Calls the Fitness mobile API with bearer-session authentication when present. */
async function apiRequest<T>(path: string, options: RequestInit = {}, session?: MobileSession | null): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
  return body as T;
}

async function refreshMobileSession(session: MobileSession): Promise<MobileSession> {
  return apiRequest<MobileSession>('/api/mobile/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
}

async function authenticatedRequest<T>(
  path: string,
  options: RequestInit,
  session: MobileSession,
  onSessionChange: (session: MobileSession | null) => Promise<void>
): Promise<T> {
  try {
    return await apiRequest<T>(path, options, session);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes('unauthorized')) {
      throw error;
    }

    const refreshedSession = await refreshMobileSession(session);
    await onSessionChange(refreshedSession);
    return apiRequest<T>(path, options, refreshedSession);
  }
}

function MobileApp() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setRestoring(false));
  }, []);

  async function handleSessionChange(nextSession: MobileSession | null) {
    if (nextSession) {
      await saveSession(nextSession);
    } else {
      await clearSession();
      queryClient.clear();
    }
    setSession(nextSession);
  }

  if (restoring) {
    return <LoadingScreen label="Opening Fitness PT Tracker" />;
  }

  return session ? (
    <DashboardScreen session={session} onSessionChange={handleSessionChange} />
  ) : (
    <LoginScreen onSessionChange={handleSessionChange} />
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <ActivityIndicator size="large" color="#14b8a6" />
      <Text style={styles.loadingLabel}>{label}</Text>
    </SafeAreaView>
  );
}

function LoginScreen({ onSessionChange }: { onSessionChange: (session: MobileSession) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: () =>
      apiRequest<MobileSession>('/api/mobile/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      }),
    onSuccess: onSessionChange,
    onError: (error) => Alert.alert('Sign in failed', error.message),
  });

  return (
    <SafeAreaView style={styles.authScreen}>
      <ImageBackground source={VISUALS.login} style={styles.authHero} imageStyle={styles.authHeroImage}>
        <View style={styles.mediaShade} />
        <View style={styles.brandBlock}>
          <Text style={styles.brandEyebrow}>Fitness PT Tracker</Text>
          <Text style={styles.brandTitle}>Trainers and clients, in sync.</Text>
          <Text style={styles.brandText}>Manage appointments, check-ins, workouts, and progress from your phone.</Text>
        </View>
      </ImageBackground>

      <View style={styles.formCard}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={email}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <PrimaryButton
          disabled={!email || !password || loginMutation.isPending}
          label={loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          onPress={() => loginMutation.mutate()}
        />
      </View>
    </SafeAreaView>
  );
}

function DashboardScreen({ session, onSessionChange }: { session: MobileSession; onSessionChange: (session: MobileSession | null) => Promise<void> }) {
  const [activeView, setActiveView] = useState<ActiveView>('appointments');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const queryClientInstance = useQueryClient();
  const request = <T,>(path: string, options: RequestInit = {}) => authenticatedRequest<T>(path, options, session, onSessionChange);
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', session.user.id],
    queryFn: () => request<DashboardData>('/api/mobile/dashboard'),
  });

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', session.user.id],
    queryFn: () => request<Appointment[]>('/api/mobile/appointments?limit=50'),
  });

  const progressQuery = useQuery({
    queryKey: ['progress', session.user.id],
    queryFn: () => request<ProgressData>('/api/mobile/progress'),
    enabled: session.user.role === 'CLIENT',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      request<Appointment>(`/api/mobile/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: async (appointment) => {
      setSelectedAppointment(appointment);
      await queryClientInstance.invalidateQueries({ queryKey: ['dashboard', session.user.id] });
      await queryClientInstance.invalidateQueries({ queryKey: ['appointments', session.user.id] });
    },
    onError: (error) => Alert.alert('Unable to update appointment', error.message),
  });

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) => checkInWithLocation(appointmentId, session, onSessionChange),
    onSuccess: async () => {
      await queryClientInstance.invalidateQueries({ queryKey: ['appointments', session.user.id] });
      Alert.alert('Check-in sent', 'Your location check-in has been submitted.');
    },
    onError: (error) => Alert.alert('Unable to check in', error.message),
  });

  const workoutMutation = useMutation({
    mutationFn: ({ appointmentId, workout }: { appointmentId: string; workout: WorkoutPayload }) =>
      request<WorkoutLog>(`/api/mobile/appointments/${appointmentId}/workout`, { method: 'POST', body: JSON.stringify(workout) }),
    onSuccess: async () => {
      setSelectedAppointment(null);
      await queryClientInstance.invalidateQueries({ queryKey: ['dashboard', session.user.id] });
      await queryClientInstance.invalidateQueries({ queryKey: ['appointments', session.user.id] });
      await queryClientInstance.invalidateQueries({ queryKey: ['progress', session.user.id] });
      Alert.alert('Workout logged', 'The appointment has been marked complete.');
    },
    onError: (error) => Alert.alert('Unable to log workout', error.message),
  });

  const logoutMutation = useMutation({
    mutationFn: () => request<{ success: boolean }>('/api/mobile/auth/logout', { method: 'POST' }),
    onSettled: () => onSessionChange(null),
  });

  const appointments = appointmentsQuery.data ?? [];

  if (dashboardQuery.isLoading || appointmentsQuery.isLoading) {
    return <LoadingScreen label="Loading your dashboard" />;
  }

  if (selectedAppointment) {
    return (
      <AppointmentDetailScreen
        appointment={selectedAppointment}
        isClient={session.user.role === 'CLIENT'}
        onBack={() => setSelectedAppointment(null)}
        onCancel={() => statusMutation.mutate({ id: selectedAppointment.id, status: 'CANCELLED' })}
        onCheckIn={() => checkInMutation.mutate(selectedAppointment.id)}
        onConfirm={() => statusMutation.mutate({ id: selectedAppointment.id, status: 'CONFIRMED' })}
        onLogWorkout={(workout) => workoutMutation.mutate({ appointmentId: selectedAppointment.id, workout })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{session.user.role}</Text>
          <Text style={styles.headerTitle}>{session.user.name || session.user.email}</Text>
        </View>
        <Pressable onPress={() => logoutMutation.mutate()} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>{logoutMutation.isPending ? 'Signing out' : 'Sign out'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {session.user.role === 'CLIENT' && (
          <View style={styles.segmentedControl}>
            <SegmentButton active={activeView === 'appointments'} label="Appointments" onPress={() => setActiveView('appointments')} />
            <SegmentButton active={activeView === 'progress'} label="Progress" onPress={() => setActiveView('progress')} />
          </View>
        )}

        <DashboardHero role={session.user.role} upcomingAppointments={dashboardQuery.data?.stats.upcomingAppointments ?? 0} />

        <View style={styles.statsGrid}>
          <MetricCard label="Total" value={dashboardQuery.data?.stats.totalAppointments ?? 0} />
          <MetricCard label="Upcoming" value={dashboardQuery.data?.stats.upcomingAppointments ?? 0} />
          <MetricCard label="Complete" value={`${dashboardQuery.data?.stats.completionRate ?? 0}%`} />
          <MetricCard label="No-show" value={`${dashboardQuery.data?.stats.noShowRate ?? 0}%`} />
        </View>

        {activeView === 'progress' && session.user.role === 'CLIENT' ? (
          <ProgressScreen data={progressQuery.data} loading={progressQuery.isLoading} onRefresh={() => progressQuery.refetch()} />
        ) : (
          <>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Appointments</Text>
              <Pressable onPress={() => appointmentsQuery.refetch()}>
                <Text style={styles.linkText}>Refresh</Text>
              </Pressable>
            </View>

            <FlatList
              data={appointments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AppointmentRow
                  appointment={item}
                  isClient={session.user.role === 'CLIENT'}
                  onPress={() => setSelectedAppointment(item)}
                />
              )}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No appointments assigned yet.</Text>}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Requests native GPS coordinates and submits the Fitness check-in payload. */
function checkInWithLocation(appointmentId: string, session: MobileSession, onSessionChange: (session: MobileSession | null) => Promise<void>) {
  return new Promise((resolve, reject) => {
    Geolocation.requestAuthorization(
      () => {
        Geolocation.getCurrentPosition(
          (position) => {
            authenticatedRequest(`/api/mobile/appointments/${appointmentId}/checkin`, {
              method: 'POST',
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            }, session, onSessionChange)
              .then(resolve)
              .catch(reject);
          },
          reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      },
      reject
    );
  });
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function DashboardHero({ role, upcomingAppointments }: { role: UserRole; upcomingAppointments: number }) {
  const isTrainer = role === 'TRAINER';
  const title = role === 'CLIENT' ? 'Your next session starts before you arrive.' : isTrainer ? 'Coaching days, clearer at a glance.' : 'A live picture of studio demand.';
  const caption = role === 'CLIENT'
    ? `${upcomingAppointments} upcoming plan${upcomingAppointments === 1 ? '' : 's'} to keep momentum visible.`
    : isTrainer
      ? `${upcomingAppointments} upcoming appointment${upcomingAppointments === 1 ? '' : 's'} ready for coaching.`
      : `${upcomingAppointments} upcoming booking${upcomingAppointments === 1 ? '' : 's'} across the gym.`;

  return (
    <ImageBackground source={isTrainer ? VISUALS.trainer : VISUALS.coach} style={styles.dashboardHero} imageStyle={styles.dashboardHeroImage}>
      <View style={styles.mediaShade} />
      <View style={styles.mediaTextBlock}>
        <Text style={styles.mediaEyebrow}>{role === 'CLIENT' ? 'Training picture' : 'Studio picture'}</Text>
        <Text style={styles.mediaTitle}>{title}</Text>
        <Text style={styles.mediaCaption}>{caption}</Text>
      </View>
    </ImageBackground>
  );
}

function ProgressScreen({ data, loading, onRefresh }: { data?: ProgressData; loading: boolean; onRefresh: () => void }) {
  if (loading) {
    return <Text style={styles.emptyText}>Loading progress...</Text>;
  }

  const latest = data?.latestMeasurement;
  return (
    <View style={styles.panelStack}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <Pressable onPress={onRefresh}>
          <Text style={styles.linkText}>Refresh</Text>
        </Pressable>
      </View>

      <ImageBackground source={VISUALS.progress} style={styles.progressHero} imageStyle={styles.dashboardHeroImage}>
        <View style={styles.mediaShade} />
        <View style={styles.mediaTextBlock}>
          <Text style={styles.mediaEyebrow}>Body metrics</Text>
          <Text style={styles.mediaTitle}>Progress should feel visible.</Text>
          <Text style={styles.mediaCaption}>Measurements and workouts stay together so each session has context.</Text>
        </View>
      </ImageBackground>

      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Latest measurement</Text>
        {latest ? (
          <View style={styles.measurementGrid}>
            <MiniMetric label="Weight" value={formatOptionalNumber(latest.weightKg, 'kg')} />
            <MiniMetric label="Body fat" value={formatOptionalNumber(latest.bodyFatPct, '%')} />
            <MiniMetric label="Waist" value={formatOptionalNumber(latest.waistCm, 'cm')} />
            <MiniMetric label="Chest" value={formatOptionalNumber(latest.chestCm, 'cm')} />
          </View>
        ) : (
          <Text style={styles.emptyText}>No measurements have been logged yet.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Recent workouts</Text>
      {(data?.workoutLogs ?? []).length > 0 ? (
        data!.workoutLogs.map((log) => <WorkoutRow key={log.id} workout={log} />)
      ) : (
        <Text style={styles.emptyText}>No workout logs yet.</Text>
      )}
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMetric}>
      <Text style={styles.miniMetricValue}>{value}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
    </View>
  );
}

function WorkoutRow({ workout }: { workout: WorkoutLog }) {
  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentTopline}>
        <Text style={styles.appointmentTime}>{workout.workoutType.replace('_', ' ')}</Text>
        <Text style={styles.appointmentMeta}>{workout.durationMinutes} min</Text>
      </View>
      <Text style={styles.appointmentName}>{workout.appointment ? formatDateTime(workout.appointment.startsAt) : formatDateTime(workout.completedAt)}</Text>
      <Text style={styles.appointmentMeta}>{workout.notes || workout.appointment?.gymLocation.name || 'Workout logged'}</Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function AppointmentRow({ appointment, isClient, onPress }: { appointment: Appointment; isClient: boolean; onPress: () => void }) {
  const counterpart = isClient ? appointment.trainer.user : appointment.client.user;
  return (
    <Pressable onPress={onPress} style={styles.appointmentCard}>
      <ImageBackground source={isClient ? VISUALS.coach : VISUALS.trainer} style={styles.appointmentImage} imageStyle={styles.appointmentImageStyle}>
        <View style={styles.appointmentImageOverlay}>
          <Text style={styles.appointmentImageText}>{isClient ? 'Coach session' : 'Client session'}</Text>
        </View>
      </ImageBackground>
      <View style={styles.appointmentTopline}>
        <Text style={styles.appointmentTime}>{formatDateTime(appointment.startsAt)}</Text>
        <StatusPill status={appointment.status} />
      </View>
      <Text style={styles.appointmentName}>{counterpart.name || counterpart.email}</Text>
      <Text style={styles.appointmentMeta}>{appointment.gymLocation.name}</Text>
    </Pressable>
  );
}

function AppointmentDetailScreen({ appointment, isClient, onBack, onCancel, onCheckIn, onConfirm, onLogWorkout }: {
  appointment: Appointment;
  isClient: boolean;
  onBack: () => void;
  onCancel: () => void;
  onCheckIn: () => void;
  onConfirm: () => void;
  onLogWorkout: (workout: WorkoutPayload) => void;
}) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('STRENGTH');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [intensity, setIntensity] = useState('6');
  const [notes, setNotes] = useState('');
  const counterpart = isClient ? appointment.trainer.user : appointment.client.user;
  const canCancel = ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(appointment.status);
  const canLogWorkout = !isClient && !appointment.workoutLog && appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW';

  function submitWorkout() {
    const duration = Number(durationMinutes);
    const workoutIntensity = intensity ? Number(intensity) : undefined;
    if (!Number.isFinite(duration) || duration < 1) {
      Alert.alert('Duration required', 'Enter a workout duration of at least one minute.');
      return;
    }
    if (workoutIntensity !== undefined && (!Number.isFinite(workoutIntensity) || workoutIntensity < 1 || workoutIntensity > 10)) {
      Alert.alert('Intensity out of range', 'Use an intensity from 1 to 10.');
      return;
    }
    onLogWorkout({ workoutType, durationMinutes: duration, intensity: workoutIntensity, notes: notes.trim() || undefined });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
        <StatusPill status={appointment.status} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground source={isClient ? VISUALS.coach : VISUALS.trainer} style={styles.detailHero} imageStyle={styles.dashboardHeroImage}>
          <View style={styles.mediaShade} />
          <View style={styles.mediaTextBlock}>
            <Text style={styles.mediaEyebrow}>{isClient ? 'Trainer session' : 'Client session'}</Text>
            <Text style={styles.mediaTitle}>{appointment.gymLocation.name}</Text>
            <Text style={styles.mediaCaption}>{formatDateTime(appointment.startsAt)}</Text>
          </View>
        </ImageBackground>
        <Text style={styles.detailTitle}>{counterpart.name || counterpart.email}</Text>
        <Text style={styles.detailSubtitle}>{formatDateTime(appointment.startsAt)}</Text>

        <InfoBlock label="Location" value={`${appointment.gymLocation.name}${appointment.gymLocation.address ? `, ${appointment.gymLocation.address}` : ''}`} />
        <InfoBlock label={isClient ? 'Trainer' : 'Client'} value={counterpart.email} />

        {!isClient && appointment.status === 'PENDING' && <PrimaryButton label="Confirm appointment" onPress={onConfirm} />}
        {isClient && appointment.status === 'CONFIRMED' && <PrimaryButton label="Check in at gym" onPress={onCheckIn} />}
        {canLogWorkout && (
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Log workout</Text>
            <View style={styles.workoutTypeGrid}>
              {(['STRENGTH', 'CARDIO', 'MOBILITY', 'HIIT'] as WorkoutType[]).map((type) => (
                <SegmentButton key={type} active={workoutType === type} label={type} onPress={() => setWorkoutType(type)} />
              ))}
            </View>
            <Text style={styles.label}>Duration minutes</Text>
            <TextInput keyboardType="number-pad" onChangeText={setDurationMinutes} style={styles.input} value={durationMinutes} />
            <Text style={styles.label}>Intensity 1-10</Text>
            <TextInput keyboardType="number-pad" onChangeText={setIntensity} style={styles.input} value={intensity} />
            <Text style={styles.label}>Notes</Text>
            <TextInput multiline onChangeText={setNotes} placeholder="Workout notes" placeholderTextColor="#94a3b8" style={[styles.input, styles.textArea]} value={notes} />
            <PrimaryButton label="Save workout" onPress={submitWorkout} />
          </View>
        )}
        {canCancel && <DangerButton label="Cancel appointment" onPress={onCancel} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusText}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

function PrimaryButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.disabledButton]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.dangerButton}>
      <Text style={styles.dangerButtonText}>{label}</Text>
    </Pressable>
  );
}

/** Formats API dates for the compact mobile appointment list. */
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatOptionalNumber(value: number | null, suffix: string) {
  return value === null ? '--' : `${value}${suffix}`;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  loadingLabel: {
    color: '#134e4a',
    fontSize: 15,
    fontWeight: '700',
  },
  authScreen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0f2f2b',
    padding: 22,
  },
  authHero: {
    minHeight: 280,
    justifyContent: 'flex-end',
    marginBottom: 18,
    overflow: 'hidden',
    borderRadius: 8,
  },
  authHeroImage: {
    borderRadius: 8,
  },
  mediaShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  brandBlock: {
    padding: 18,
  },
  brandEyebrow: {
    color: '#5eead4',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  brandTitle: {
    marginTop: 8,
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
  brandText: {
    marginTop: 12,
    color: '#ccfbf1',
    fontSize: 16,
    lineHeight: 23,
  },
  formCard: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 10,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    color: '#0f172a',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 13 : 9,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#0f2f2b',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: Platform.OS === 'android' ? 20 : 4,
  },
  eyebrow: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerTitle: {
    marginTop: 2,
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  ghostButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2dd4bf',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: '#ccfbf1',
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    padding: 18,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
    backgroundColor: '#ecfeff',
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#0f766e',
  },
  segmentButtonText: {
    color: '#115e59',
    fontSize: 13,
    fontWeight: '900',
  },
  segmentButtonTextActive: {
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dashboardHero: {
    minHeight: 210,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 8,
  },
  dashboardHeroImage: {
    borderRadius: 8,
  },
  mediaTextBlock: {
    padding: 16,
  },
  mediaEyebrow: {
    color: '#99f6e4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  mediaTitle: {
    marginTop: 5,
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28,
  },
  mediaCaption: {
    marginTop: 8,
    color: '#ecfeff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  metricCard: {
    minWidth: '47%',
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  metricValue: {
    color: '#0f766e',
    fontSize: 25,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 3,
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
  },
  linkText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  appointmentCard: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  appointmentImage: {
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 12,
  },
  appointmentImageStyle: {
    borderRadius: 8,
  },
  appointmentImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    padding: 10,
  },
  appointmentImageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  appointmentTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  appointmentTime: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  appointmentName: {
    marginTop: 8,
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
  },
  appointmentMeta: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    color: '#115e59',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 24,
  },
  panelStack: {
    gap: 14,
  },
  progressHero: {
    minHeight: 190,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 8,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  miniMetric: {
    minWidth: '47%',
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
  },
  miniMetricValue: {
    color: '#0f766e',
    fontSize: 19,
    fontWeight: '900',
  },
  miniMetricLabel: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  detailTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
  },
  detailHero: {
    minHeight: 220,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 8,
  },
  detailSubtitle: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBlock: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 5,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  workoutTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 12,
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0f766e',
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  dangerButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
  },
  dangerButtonText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default App;
