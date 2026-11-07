CREATE TYPE "ExerciseCategory" AS ENUM ('STRENGTH', 'CARDIO', 'MOBILITY', 'CONDITIONING', 'REHABILITATION', 'ASSESSMENT', 'CUSTOM');

CREATE TYPE "ExerciseMeasurementType" AS ENUM ('REPS_LOAD', 'BODYWEIGHT_REPS', 'TIME', 'DISTANCE_TIME', 'HOLD_TIME', 'CUSTOM');

CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL DEFAULT 'STRENGTH',
    "primary_muscle_group" TEXT,
    "secondary_muscle_groups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT,
    "measurement_type" "ExerciseMeasurementType" NOT NULL DEFAULT 'REPS_LOAD',
    "instructions" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_trainer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "workout_log_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "block_name" TEXT,
    "target_notes" TEXT,
    "coach_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "workout_exercise_id" TEXT NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "duration_seconds" INTEGER,
    "distance_meters" DOUBLE PRECISION,
    "rest_seconds" INTEGER,
    "rpe" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");
CREATE INDEX "exercises_category_idx" ON "exercises"("category");
CREATE INDEX "exercises_primary_muscle_group_idx" ON "exercises"("primary_muscle_group");
CREATE INDEX "workout_exercises_workout_log_id_order_index_idx" ON "workout_exercises"("workout_log_id", "order_index");
CREATE INDEX "workout_exercises_exercise_id_idx" ON "workout_exercises"("exercise_id");
CREATE INDEX "workout_sets_workout_exercise_id_set_index_idx" ON "workout_sets"("workout_exercise_id", "set_index");

ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_trainer_id_fkey" FOREIGN KEY ("created_by_trainer_id") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_log_id_fkey" FOREIGN KEY ("workout_log_id") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;