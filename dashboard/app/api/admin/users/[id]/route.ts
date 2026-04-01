import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { email, role, active, clientId } = await req.json();

  if (role && !['superadmin', 'admin', 'editor'].includes(role)) {
    return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
  }

  const db = require('../../../../../../src/db/index.js');
  try {
    const user = await db.updateUser(id, { email, role, active, clientId });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'El email ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
