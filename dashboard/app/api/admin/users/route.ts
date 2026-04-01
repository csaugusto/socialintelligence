import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { email, password, clientId, role } = await req.json();
  if (!email || !password || !clientId) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }
  if (!['admin', 'editor'].includes(role || 'editor')) {
    return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
  }

  const db = require('../../../../../src/db/index.js');
  try {
    const user = await db.createUser({ email, password, clientId, role: role || 'editor' });
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'El email ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
