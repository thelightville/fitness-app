import { NextRequest, NextResponse } from 'next/server';
import { AppointmentStatus, WorkoutType } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { getMobileAppointmentContext } from '@/lib/mobile-data';
import { requireMobileAuth } from '@/lib/mobile-auth';
import { createStructuredWorkoutExercises, toLegacyExercises, workoutLogSchema } from '@/lib/exercise-logging';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getMobileAppointmentContext(params.id, auth.user);
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (auth.user.role === 'CLIENT') return NextResponse.json({ error: 'Only trainers can log workouts' }, { status: 403 });

  const body = await req.json();
  const parsed = workoutLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.workoutLog.findUnique({ where: { appointmentId: params.id } });
  if (existing) return NextResponse.json({ error: 'Workout already logged for this appointment' }, { status: 409 });

  const { structuredExercises, exercises, ...workoutData } = parsed.data;
  const legacyExercises = exercises ?? (structuredExercises ? toLegacyExercises(structuredExercises) : []);

  const workoutLog = await prisma.$transaction(async (tx) => {
    const createdWorkoutLog = await tx.workoutLog.create({
      data: { appointmentId: params.id, loggedById: auth.user.id, exercises: legacyExercises, ...workoutData },
    });

    if (structuredExercises?.length) {
      await createStructuredWorkoutExercises({
        tx,
        workoutLogId: createdWorkoutLog.id,
        entries: structuredExercises,
        createdByTrainerId: ctx.appointment.trainerId,
      });
    }

    await tx.appointment.update({ where: { id: params.id }, data: { status: AppointmentStatus.COMPLETED } });

    return tx.workoutLog.findUniqueOrThrow({
      where: { id: createdWorkoutLog.id },
      include: {
        workoutExercises: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: true, sets: { orderBy: { setIndex: 'asc' } } },
        },
      },
    });
  });

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