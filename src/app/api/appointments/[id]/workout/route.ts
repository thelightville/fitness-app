import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppointmentStatus, UserRole, WorkoutType } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const workoutSchema = z.object({
  workoutType: z.nativeEnum(WorkoutType),
  durationMinutes: z.number().int().min(1),
  intensity: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  clientFeedback: z.string().optional(),
  exercises: z
    .array(
      z.object({
        name: z.string(),
        sets: z.number().int().optional(),
        reps: z.number().int().optional(),
        weight: z.number().optional(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = workoutSchema.safeParse(body);
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

  const isTrainer = session.user.role === UserRole.TRAINER && appointment.trainer.user.id === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;

  if (!isTrainer && !isAdmin) {
    return NextResponse.json({ error: 'Only the assigned trainer or admin can log a workout' }, { status: 403 });
  }

  if (appointment.workoutLog) {
    return NextResponse.json({ error: 'Workout already logged for this appointment' }, { status: 409 });
  }

  const { workoutType, durationMinutes, intensity, notes, clientFeedback, exercises } = parsed.data;

  const [workoutLog] = await prisma.$transaction([
    prisma.workoutLog.create({
      data: {
        appointmentId: appointment.id,
        loggedById: session.user.id,
        workoutType,
        durationMinutes,
        intensity,
        notes,
        clientFeedback,
        exercises: exercises ?? [],
      },
    }),
    prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.COMPLETED },
    }),
  ]);

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
