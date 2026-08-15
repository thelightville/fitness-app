import { prisma } from './db';
import { ReminderChannel, ReminderStatus, AppointmentStatus } from '@prisma/client';
import { sendMail, buildReminderContent } from './mail';
import { subHours } from 'date-fns';

export async function createRemindersForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { include: { user: { select: { id: true, email: true, name: true } } } },
      trainer: { include: { user: { select: { id: true, email: true, name: true } } } },
      gymLocation: true,
    },
  });

  if (!appointment) return;

  const reminders = [];

  // 24 hours before
  reminders.push({
    appointmentId: appointment.id,
    userId: appointment.client.user.id,
    channel: ReminderChannel.EMAIL,
    scheduledFor: subHours(appointment.startsAt, 24),
  });

  // 2 hours before
  reminders.push({
    appointmentId: appointment.id,
    userId: appointment.client.user.id,
    channel: ReminderChannel.EMAIL,
    scheduledFor: subHours(appointment.startsAt, 2),
  });

  // Trainer reminder 2 hours before
  reminders.push({
    appointmentId: appointment.id,
    userId: appointment.trainer.user.id,
    channel: ReminderChannel.EMAIL,
    scheduledFor: subHours(appointment.startsAt, 2),
  });

  await prisma.reminder.createMany({
    data: reminders,
    skipDuplicates: true,
  });
}

export async function processPendingReminders() {
  const now = new Date();

  const pending = await prisma.reminder.findMany({
    where: {
      status: ReminderStatus.SCHEDULED,
      scheduledFor: { lte: now },
      appointment: { status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] } },
    },
    include: {
      user: { select: { email: true, name: true } },
      appointment: {
        include: {
          trainer: { include: { user: { select: { name: true } } } },
          gymLocation: true,
        },
      },
    },
  });

  for (const reminder of pending) {
    try {
      const { subject, text } = buildReminderContent(
        reminder.appointment,
        reminder.user.name || 'there'
      );

      if (reminder.user.email) {
        await sendMail({
          to: reminder.user.email,
          subject,
          text,
        });
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: ReminderStatus.SENT, sentAt: new Date() },
      });
    } catch (err) {
      console.error('Failed to send reminder', reminder.id, err);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.FAILED,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    }
  }

  return { processed: pending.length };
}
