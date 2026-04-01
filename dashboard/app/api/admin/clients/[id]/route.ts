import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const db = require('../../../../../../src/db/index.js');
  const [client, users] = await Promise.all([
    db.getClient(id),
    db.getUsersByClientId(id),
  ]);
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  return NextResponse.json({ client, users });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const db = require('../../../../../../src/db/index.js');
  try {
    const client = await db.updateClient(id, body);
    if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    return NextResponse.json(client);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
