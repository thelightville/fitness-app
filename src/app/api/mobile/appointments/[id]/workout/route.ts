import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus, WorkoutType } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getMobileAppointmentContext } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';

const workoutSchema = z.object({
  workoutType: z.nativeEnum(WorkoutType),
  durationMinutes: z.number().int().min(1),
  intensity: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  clientFeedback: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getMobileAppointmentContext(params.id, auth.user);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (auth.user.role === 'CLIENT') return NextResponse.json({ error: 'Only trainers can log workouts' }, { status: 403 });

  const body = await req.json();
  const parsed = workoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.workoutLog.findUnique({ where: { appointmentId: params.id } });
  if (existing) return NextResponse.json({ error: 'Workout already logged for this appointment' }, { status: 409 });

  const [workoutLog] = await prisma.$transaction([
    prisma.workoutLog.create({ data: { appointmentId: params.id, loggedById: auth.user.id, exercises: [], ...parsed.data } }),
    prisma.appointment.update({ where: { id: params.id }, data: { status: AppointmentStatus.COMPLETED } }),
  ]);

  await logAudit({
    actorId: auth.user.id,
    entityType: 'appointment',
    entityId: params.id,
    action: 'mobile_workout_logged',
    appointmentId: params.id,
    metadata: { workoutType: parsed.data.workoutType, durationMinutes: parsed.data.durationMinutes },
  });

  return NextResponse.json(workoutLog, { status: 201 });
}