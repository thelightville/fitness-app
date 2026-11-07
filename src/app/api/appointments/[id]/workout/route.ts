import { trainerCanAccessClient } from '@/lib/trainer-access';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole, WorkoutType } from '@prisma/client';
import { logAudit } from '@/lib/audit';
import { createStructuredWorkoutExercises, toLegacyExercises, workoutLogSchema } from '@/lib/exercise-logging';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = workoutLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      trainer: { include: { user: { select: { id: true } } } },
      workoutLog: true,
    },
  });

  if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

  const isTrainer = session.user.role === UserRole.TRAINER && appointment.trainer.user.id === session.user.id
    && await trainerCanAccessClient(session.user.id, appointment.clientId);
  const isAdmin = session.user.role === UserRole.ADMIN;

  if (!isTrainer && !isAdmin) {
    return NextResponse.json({ error: 'Only the assigned trainer or admin can log a workout' }, { status: 403 });
  }

  if (appointment.workoutLog) {
    return NextResponse.json({ error: 'Workout already logged for this appointment' }, { status: 409 });
  }

  const { workoutType, durationMinutes, intensity, notes, clientFeedback, exercises, structuredExercises } = parsed.data;
  const legacyExercises = exercises ?? (structuredExercises ? toLegacyExercises(structuredExercises) : []);

  const workoutLog = await prisma.$transaction(async (tx) => {
    const createdWorkoutLog = await tx.workoutLog.create({
      data: {
        appointmentId: appointment.id,
        loggedById: session.user.id,
        workoutType,
        durationMinutes,
        intensity,
        notes,
        clientFeedback,
        exercises: legacyExercises,
      },
    });

    if (structuredExercises?.length) {
      await createStructuredWorkoutExercises({
        tx,
        workoutLogId: createdWorkoutLog.id,
        entries: structuredExercises,
        createdByTrainerId: appointment.trainerId,
      });
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.COMPLETED },
    });

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
    actorId: session.user.id,
    entityType: 'appointment',
    entityId: appointment.id,
    action: 'workout_logged',
    appointmentId: appointment.id,
    metadata: { workoutType, durationMinutes, intensity },
  });

  return NextResponse.json(workoutLog, { status: 201 });
}
