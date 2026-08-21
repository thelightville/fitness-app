import Geolocation from '@react-native-community/geolocation';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

type UserRole = 'CLIENT' | 'TRAINER' | 'ADMIN';
type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW';

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
  client: { user: { name: string | null; email: string } };
  trainer: { user: { name: string | null; email: string } };
  gymLocation: { name: string; address: string | null; latitude: number; longitude: number; checkInRadiusMeters: number };
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
      <View style={styles.brandBlock}>
        <Text style={styles.brandEyebrow}>Fitness PT Tracker</Text>
        <Text style={styles.brandTitle}>Trainers and clients, in sync.</Text>
        <Text style={styles.brandText}>Manage appointments, check-ins, workouts, and progress from your phone.</Text>
      </View>

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const queryClientInstance = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', session.user.id],
    queryFn: () => apiRequest<DashboardData>('/api/mobile/dashboard', {}, session),
  });

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', session.user.id],
    queryFn: () => apiRequest<Appointment[]>('/api/mobile/appointments?limit=50', {}, session),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      apiRequest<Appointment>(`/api/mobile/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, session),
    onSuccess: async (appointment) => {
      setSelectedAppointment(appointment);
      await queryClientInstance.invalidateQueries({ queryKey: ['dashboard', session.user.id] });
      await queryClientInstance.invalidateQueries({ queryKey: ['appointments', session.user.id] });
    },
    onError: (error) => Alert.alert('Unable to update appointment', error.message),
  });

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) => checkInWithLocation(appointmentId, session),
    onSuccess: async () => {
      await queryClientInstance.invalidateQueries({ queryKey: ['appointments', session.user.id] });
      Alert.alert('Check-in sent', 'Your location check-in has been submitted.');
    },
    onError: (error) => Alert.alert('Unable to check in', error.message),
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
        <Pressable onPress={() => onSessionChange(null)} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <MetricCard label="Total" value={dashboardQuery.data?.stats.totalAppointments ?? 0} />
          <MetricCard label="Upcoming" value={dashboardQuery.data?.stats.upcomingAppointments ?? 0} />
          <MetricCard label="Complete" value={`${dashboardQuery.data?.stats.completionRate ?? 0}%`} />
          <MetricCard label="No-show" value={`${dashboardQuery.data?.stats.noShowRate ?? 0}%`} />
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

/** Requests native GPS coordinates and submits the Fitness check-in payload. */
function checkInWithLocation(appointmentId: string, session: MobileSession) {
  return new Promise((resolve, reject) => {
    Geolocation.requestAuthorization(
      () => {
        Geolocation.getCurrentPosition(
          (position) => {
            apiRequest(`/api/mobile/appointments/${appointmentId}/checkin`, {
              method: 'POST',
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            }, session)
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
      <View style={styles.appointmentTopline}>
        <Text style={styles.appointmentTime}>{formatDateTime(appointment.startsAt)}</Text>
        <StatusPill status={appointment.status} />
      </View>
      <Text style={styles.appointmentName}>{counterpart.name || counterpart.email}</Text>
      <Text style={styles.appointmentMeta}>{appointment.gymLocation.name}</Text>
    </Pressable>
  );
}

function AppointmentDetailScreen({ appointment, isClient, onBack, onCancel, onCheckIn, onConfirm }: {
  appointment: Appointment;
  isClient: boolean;
  onBack: () => void;
  onCancel: () => void;
  onCheckIn: () => void;
  onConfirm: () => void;
}) {
  const counterpart = isClient ? appointment.trainer.user : appointment.client.user;
  const canCancel = ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(appointment.status);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
        <StatusPill status={appointment.status} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.detailTitle}>{counterpart.name || counterpart.email}</Text>
        <Text style={styles.detailSubtitle}>{formatDateTime(appointment.startsAt)}</Text>

        <InfoBlock label="Location" value={`${appointment.gymLocation.name}${appointment.gymLocation.address ? `, ${appointment.gymLocation.address}` : ''}`} />
        <InfoBlock label={isClient ? 'Trainer' : 'Client'} value={counterpart.email} />

        {!isClient && appointment.status === 'PENDING' && <PrimaryButton label="Confirm appointment" onPress={onConfirm} />}
        {isClient && appointment.status === 'CONFIRMED' && <PrimaryButton label="Check in at gym" onPress={onCheckIn} />}
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
  brandBlock: {
    marginBottom: 26,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  detailTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
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
