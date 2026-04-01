import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroySession } from '@/lib/auth';

const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(req: NextRequest) {
  const { user, password } = await req.json();

  // Intenta verificar contra la base de datos (PostgreSQL activo)
  if (process.env.DATABASE_URL) {
    try {
      const db = require('../../../../src/db/index.js');
      const dbUser = await db.verifyUserPassword(user, password);
      if (dbUser) {
        await createSession({
          userId: dbUser.id,
          clientId: dbUser.client_id || DEFAULT_CLIENT_ID,
          role: dbUser.role || 'editor',
        });
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    } catch (err) {
      console.error('[auth] Error consultando DB:', err);
      // Si la DB falla, cae al fallback de env vars
    }
  }

  // Fallback: env vars (desarrollo sin DB o DB no disponible)
  if (
    user === process.env.DASHBOARD_USER &&
    password === process.env.DASHBOARD_PASSWORD
  ) {
    await createSession({
      userId: 'dev-user',
      clientId: DEFAULT_CLIENT_ID,
      role: 'admin',
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
