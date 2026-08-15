import { UserRole, AppointmentStatus, WorkoutType } from '@prisma/client';

export { UserRole, AppointmentStatus, WorkoutType };

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image?: string | null;
}

export interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  upcomingAppointments: number;
  completionRate: number;
  noShowRate: number;
}

export interface WorkoutBreakdown {
  type: WorkoutType;
  count: number;
}

export interface TrainerUtilization {
  trainerId: string;
  trainerName: string | null;
  totalSessions: number;
  completedSessions: number;
}
