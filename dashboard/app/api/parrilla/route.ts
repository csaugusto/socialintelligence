import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = require('../../../../src/db/index.js');
  const items = await db.getParrilla(session.clientId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { articleId, articleTitle, network, scheduledFor, copy, hashtags } = await req.json();
  if (!articleId || !network || !scheduledFor) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const db = require('../../../../src/db/index.js');
  const result = await db.addToParrilla({
    articleId,
    articleTitle,
    network,
    scheduledFor,
    copy,
    hashtags,
    clientId: session.clientId,
  });
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  const db = require('../../../../src/db/index.js');
  await db.removeFromParrilla(id, session.clientId);
  return NextResponse.json({ ok: true });
}
