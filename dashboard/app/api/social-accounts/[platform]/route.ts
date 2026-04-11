import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { platform } = await params;
  const db = require('../../../../../src/db/index.js');
  await db.deleteSocialAccount(session.workspaceId, platform);
  return NextResponse.json({ ok: true });
}
