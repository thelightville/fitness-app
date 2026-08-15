import { NextResponse } from 'next/server';
import { processPendingReminders } from '@/lib/reminders';

export async function GET(req: Request) {
  // Simple cron secret check
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await processPendingReminders();
  return NextResponse.json(result);
}
