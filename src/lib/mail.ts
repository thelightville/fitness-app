import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured. Email not sent:', subject);
    return { messageId: 'mock', accepted: [to] };
  }

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return result;
}

export function buildReminderContent(
  appointment: {
    startsAt: Date;
    trainer: { user: { name: string | null } };
    gymLocation: { name: string; address: string | null };
  },
  recipientName: string
) {
  const date = appointment.startsAt.toLocaleString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Reminder: PT session on ${date}`;
  const text = `Hi ${recipientName},

This is a reminder for your upcoming personal training session.

Date: ${date}
Trainer: ${appointment.trainer.user.name || 'Your PT'}
Location: ${appointment.gymLocation.name}${appointment.gymLocation.address ? `, ${appointment.gymLocation.address}` : ''}

See you there!

${process.env.APP_NAME || 'Fitness PT Tracker'}`;

  return { subject, text };
}
