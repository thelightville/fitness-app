import { NextRequest, NextResponse } from 'next/server';
import { requireMobileAuth, revokeMobileSession } from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await revokeMobileSession(auth.sessionId);
  return NextResponse.json({ success: true });
}