import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession, destroySession } from '@/lib/auth';

// POST — entrar como un cliente
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { clientId, clientName } = await req.json();
  if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 });

  const db = require('../../../../../src/db/index.js');
  const client = await db.getClient(clientId);
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  await createSession({
    userId: session.userId,
    clientId,
    role: 'admin',
    impersonating: true,
  });

  return NextResponse.json({ ok: true, clientName: clientName || client.name, vertical: client.vertical });
}

// DELETE — volver a superadmin
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await createSession({
    userId: session.userId,
    clientId: '00000000-0000-0000-0000-000000000001',
    role: 'superadmin',
    impersonating: false,
  });

  return NextResponse.json({ ok: true });
}
