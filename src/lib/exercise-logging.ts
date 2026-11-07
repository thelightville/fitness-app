import { ExerciseCategory, ExerciseMeasurementType, Prisma, WorkoutType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const workoutSetSchema = z.object({
  reps: z.number().int().min(0).optional(),
  weightKg: z.number().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  distanceMeters: z.number().min(0).optional(),
  restSeconds: z.number().int().min(0).optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  completed: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const structuredExerciseSchema = z.object({
  exerciseId: z.string().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  category: z.nativeEnum(ExerciseCategory).optional(),
  measurementType: z.nativeEnum(ExerciseMeasurementType).optional(),
  blockName: z.string().trim().max(80).optional(),
  targetNotes: z.string().trim().max(500).optional(),
  coachNotes: z.string().trim().max(1000).optional(),
  sets: z.array(workoutSetSchema).min(1).max(20).default([]),
}).refine((entry) => entry.exerciseId || entry.name, {
  message: 'Choose an exercise or enter a custom exercise name.',
});

export const workoutLogSchema = z.object({
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
  structuredExercises: z.array(structuredExerciseSchema).max(30).optional(),
});

export type StructuredExerciseInput = z.infer<typeof structuredExerciseSchema>;
type WorkoutSetInput = z.infer<typeof workoutSetSchema>;

/** Creates ordered structured exercise and set records for a workout log. */
export async function createStructuredWorkoutExercises({
  tx,
  workoutLogId,
  entries,
  createdByTrainerId,
}: {
  tx: Prisma.TransactionClient;
  workoutLogId: string;
  entries: StructuredExerciseInput[];
  createdByTrainerId?: string;
}) {
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex];
    const exercise = entry.exerciseId
      ? await tx.exercise.findUnique({ where: { id: entry.exerciseId } })
      : await tx.exercise.upsert({
          where: { name: entry.name!.trim() },
          update: {},
          create: {
            name: entry.name!.trim(),
            category: entry.category ?? ExerciseCategory.CUSTOM,
            measurementType: entry.measurementType ?? ExerciseMeasurementType.CUSTOM,
            createdByTrainerId,
          },
        });

    if (!exercise) {
      throw new Error(`Exercise not found: ${entry.exerciseId}`);
    }

    await tx.workoutExercise.create({
      data: {
        workoutLogId,
        exerciseId: exercise.id,
        orderIndex: entryIndex,
        blockName: entry.blockName,
        targetNotes: entry.targetNotes,
        coachNotes: entry.coachNotes,
        sets: {
          create: entry.sets.map((set: WorkoutSetInput, setIndex: number) => ({
            setIndex,
            reps: set.reps,
            weightKg: set.weightKg,
            durationSeconds: set.durationSeconds,
            distanceMeters: set.distanceMeters,
            restSeconds: set.restSeconds,
            rpe: set.rpe,
            completed: set.completed ?? true,
            notes: set.notes,
          })),
        },
      },
    });
  }
}

/** Converts structured exercise entries into the legacy JSON shape for old screens and exports. */
export function toLegacyExercises(entries: StructuredExerciseInput[]) {
  return entries.map((entry) => ({
    name: entry.name ?? entry.exerciseId ?? 'Exercise',
    sets: entry.sets.length,
    reps: entry.sets[0]?.reps,
    weight: entry.sets[0]?.weightKg,
  }));
}