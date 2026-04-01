import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getClientProfile, getClient } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [profile, client] = await Promise.all([
    getClientProfile(session.clientId),
    getClient(session.clientId),
  ]);

  return NextResponse.json({ profile, client });
}
