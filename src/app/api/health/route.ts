import { NextResponse } from 'next/server';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

// Liveness + DB readiness. Deliberately returns no internal details.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up' });
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 });
  }
}
