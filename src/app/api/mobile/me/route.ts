import { NextRequest, NextResponse } from 'next/server';
import { requireMobileAuth } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ user: auth.user });
}