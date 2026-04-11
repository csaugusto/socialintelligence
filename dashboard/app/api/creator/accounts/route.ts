import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const viewAs = session.role === 'superadmin' ? req.nextUrl.searchParams.get('clientId') : null;
  const clientId = viewAs || session.clientId;

  const db = require('../../../../../src/db/index.js');
  const accounts = await db.getSocialAccounts(clientId);
  // No exponer tokens
  return NextResponse.json(accounts.map((a: Record<string, unknown>) => ({
    id: a.id, platform: a.platform, username: a.username,
    channel_id: a.channel_id, connection_type: a.connection_type,
    last_synced_at: a.last_synced_at,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { platform, username, channelId } = await req.json();
  if (!platform || (!username && !channelId)) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  const db = require('../../../../../src/db/index.js');
  const account = await db.saveSocialAccount(session.clientId, {
    platform, username, channelId, connectionType: 'username',
  });
  return NextResponse.json({ id: account.id, platform: account.platform, username: account.username });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { platform } = await req.json();
  const db = require('../../../../../src/db/index.js');
  await db.deleteSocialAccount(session.clientId, platform);
  return NextResponse.json({ success: true });
}
