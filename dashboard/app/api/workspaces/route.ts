import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = require('../../../../src/db/index.js');
  const workspaces = await db.getUserWorkspaces(session.userId);
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name, type, vertical } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const db = require('../../../../src/db/index.js');
  const workspace = await db.createWorkspace({
    userId: session.userId,
    name: name.trim(),
    type: type || 'creator',
    vertical: vertical || 'creator',
  });

  return NextResponse.json({ workspace });
}
