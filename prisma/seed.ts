import { PrismaClient, UserRole, AppointmentStatus, WorkoutType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('AdminPass123!', 12);
  const clientPassword = await bcrypt.hash('ClientPass123!', 12);
  const trainerPassword = await bcrypt.hash('TrainerPass123!', 12);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitness.myapps.com.ng' },
    update: {},
    create: {
      email: 'admin@fitness.myapps.com.ng',
      name: 'System Admin',
      role: UserRole.ADMIN,
      password: adminPassword,
    },
  });

  // Trainer user
  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@fitness.myapps.com.ng' },
    update: {},
    create: {
      email: 'trainer@fitness.myapps.com.ng',
      name: 'Demo Trainer',
      role: UserRole.TRAINER,
      phone: '+2348012345678',
      password: trainerPassword,
    },
  });

  const trainer = await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      bio: 'Certified personal trainer with 5 years experience.',
      specialties: ['Strength', 'HIIT', 'Weight Loss'],
    },
  });

  // Trainer availability: Mon-Fri 06:00-20:00
  for (let day = 1; day <= 5; day++) {
    await prisma.trainerAvailability.upsert({
      where: { id: `seed-availability-${day}` },
      update: {},
      create: {
        id: `seed-availability-${day}`,
        trainerId: trainer.id,
        dayOfWeek: day,
        startTime: '06:00',
        endTime: '20:00',
      },
    });
  }

  // Client user
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@fitness.myapps.com.ng' },
    update: {},
    create: {
      email: 'client@fitness.myapps.com.ng',
      name: 'Demo Client',
      role: UserRole.CLIENT,
      phone: '+2348098765432',
      password: clientPassword,
    },
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      goals: 'Lose weight and build strength',
    },
  });

  // Gym location
  const gym = await prisma.gymLocation.upsert({
    where: { id: 'seed-gym-main' },
    update: {},
    create: {
      id: 'seed-gym-main',
      name: 'Main Gym',
      address: '123 Fitness Street, Lagos',
      latitude: 6.5244,
      longitude: 3.3792,
      checkInRadiusMeters: 150,
    },
  });

  // Sample appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const appointment = await prisma.appointment.upsert({
    where: { id: 'seed-appointment-1' },
    update: {},
    create: {
      id: 'seed-appointment-1',
      clientId: client.id,
      trainerId: trainer.id,
      gymLocationId: gym.id,
      startsAt: tomorrow,
      endsAt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      status: AppointmentStatus.CONFIRMED,
    },
  });

  // Sample workout log for a past appointment
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0);

  const pastAppointment = await prisma.appointment.upsert({
    where: { id: 'seed-appointment-2' },
    update: {},
    create: {
      id: 'seed-appointment-2',
      clientId: client.id,
      trainerId: trainer.id,
      gymLocationId: gym.id,
      startsAt: yesterday,
      endsAt: new Date(yesterday.getTime() + 60 * 60 * 1000),
      status: AppointmentStatus.COMPLETED,
    },
  });

  await prisma.workoutLog.upsert({
    where: { appointmentId: pastAppointment.id },
    update: {},
    create: {
      appointmentId: pastAppointment.id,
      loggedById: trainerUser.id,
      workoutType: WorkoutType.STRENGTH,
      durationMinutes: 60,
      intensity: 7,
      notes: 'Good session. Increased squat weight by 5kg.',
      clientFeedback: 'Felt strong today.',
      exercises: [
        { name: 'Squat', sets: 3, reps: 10, weight: 60 },
        { name: 'Bench Press', sets: 3, reps: 8, weight: 50 },
      ],
    },
  });

  console.log('Seed data created:');
  console.log({ admin, trainerUser, clientUser, gym, appointment, pastAppointment });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
