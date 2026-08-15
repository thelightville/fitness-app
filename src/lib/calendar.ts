import { createEvent, DateArray, EventAttributes } from 'ics';

function toDateArray(date: Date): DateArray {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

export function generateAppointmentIcs(
  appointment: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    client: { user: { name: string | null; email: string } };
    trainer: { user: { name: string | null } };
    gymLocation: { name: string; address: string | null };
  }
): Promise<string> {
  const event: EventAttributes = {
    start: toDateArray(appointment.startsAt),
    end: toDateArray(appointment.endsAt),
    title: `PT Session with ${appointment.trainer.user.name || 'Trainer'}`,
    description: `Personal training session booked via ${process.env.APP_NAME || 'Fitness PT Tracker'}`,
    location: `${appointment.gymLocation.name}${appointment.gymLocation.address ? `, ${appointment.gymLocation.address}` : ''}`,
    uid: `${appointment.id}@fitness.myapps.com.ng`,
    organizer: {
      name: appointment.trainer.user.name || 'Personal Trainer',
      email: 'noreply@fitness.myapps.com.ng',
    },
    attendees: [
      {
        name: appointment.client.user.name || appointment.client.user.email,
        email: appointment.client.user.email,
        rsvp: true,
      },
    ],
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (err, value) => {
      if (err) return reject(err);
      resolve(value as string);
    });
  });
}
