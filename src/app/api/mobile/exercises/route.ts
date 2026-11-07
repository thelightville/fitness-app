import { NextRequest, NextResponse } from 'next/server';
import { ExerciseCategory, ExerciseMeasurementType, UserRole } from '@prisma/client';
import { z } from 'zod';
import { requireMobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/db';

const createExerciseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.nativeEnum(ExerciseCategory).default(ExerciseCategory.CUSTOM),
  primaryMuscleGroup: z.string().trim().max(80).optional(),
  secondaryMuscleGroups: z.array(z.string().trim().max(80)).max(12).default([]),
  equipment: z.string().trim().max(80).optional(),
  measurementType: z.nativeEnum(ExerciseMeasurementType).default(ExerciseMeasurementType.CUSTOM),
  instructions: z.string().trim().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const category = searchParams.get('category') as ExerciseCategory | null;
  const trainer = auth.user.role === UserRole.TRAINER
    ? await prisma.trainer.findUnique({ where: { userId: auth.user.id }, select: { id: true } })
    : null;

  const exercises = await prisma.exercise.findMany({
    where: {
      AND: [
        query ? { name: { contains: query, mode: 'insensitive' } } : {},
        category && Object.values(ExerciseCategory).includes(category) ? { category } : {},
        {
          OR: [
            { isSystem: true },
            trainer ? { createdByTrainerId: trainer.id } : {},
            auth.user.role === UserRole.ADMIN ? {} : { isSystem: true },
          ],
        },
      ],
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    take: 100,
  });

  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== UserRole.TRAINER && auth.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Only trainers and admins can create exercises' }, { status: 403 });
  }

  const parsed = createExerciseSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const trainer = auth.user.role === UserRole.TRAINER
    ? await prisma.trainer.findUnique({ where: { userId: auth.user.id }, select: { id: true } })
    : null;

  const exercise = await prisma.exercise.create({
    data: {
      ...parsed.data,
      createdByTrainerId: trainer?.id,
      isSystem: auth.user.role === UserRole.ADMIN,
    },
  });

  return NextResponse.json(exercise, { status: 201 });
}