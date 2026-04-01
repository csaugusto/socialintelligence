import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const db      = require('../../../../../src/db/index.js');
    const trends  = require('../../../../../src/trends/creator.js');

    const profile = await db.getClientProfile(session.clientId);
    if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 404 });

    const matcher = require('../../../../../src/trends/matcher.js');

    const rawTopics = await trends.fetch(profile);
    const matched   = await matcher.match(rawTopics, profile);
    return NextResponse.json(matched);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/trends]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
