import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getClientProfile, getClient } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const viewAs = session.role === 'superadmin' ? req.nextUrl.searchParams.get('clientId') : null;
  const clientId = viewAs || session.clientId;

  const [profile, client] = await Promise.all([
    getClientProfile(clientId),
    getClient(clientId),
  ]);

  return NextResponse.json({ profile, client });
}
