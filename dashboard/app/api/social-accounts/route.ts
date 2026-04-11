import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = require('../../../../src/db/index.js');
  const accounts = await db.getSocialAccounts(session.workspaceId);
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { platform, username } = await req.json();
  if (!platform || !username?.trim()) {
    return NextResponse.json({ error: 'Plataforma y usuario requeridos' }, { status: 400 });
  }

  const db = require('../../../../src/db/index.js');
  const account = await db.saveSocialAccount(session.workspaceId, {
    platform,
    username: username.trim(),
    connectionType: 'username',
  });
  return NextResponse.json({ account });
}
