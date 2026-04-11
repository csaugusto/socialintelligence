import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const viewAs = session.role === 'superadmin' ? req.nextUrl.searchParams.get('clientId') : null;
  const clientId = viewAs || session.clientId;

  try {
    const db      = require('../../../../../src/db/index.js');
    const trends  = require('../../../../../src/trends/creator.js');

    const profile = await db.getClientProfile(clientId);
    if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 404 });

    const matcher = require('../../../../../src/trends/matcher.js');

    const workspace  = await db.getClient(clientId);
    const rawTopics  = await trends.fetch(profile);
    const matched    = await matcher.match(rawTopics, profile, workspace);
    return NextResponse.json(matched);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/trends]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
