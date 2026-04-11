import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, email, password, workspaceName } = await req.json();

  if (!name?.trim() || !email?.trim() || !password || !workspaceName?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Registro no disponible en modo sin base de datos' }, { status: 503 });
  }

  try {
    const db = require('../../../../../src/db/index.js');
    const { user, workspace } = await db.registerUser({ name, email, password, workspaceName });

    await createSession({
      userId:        user.id,
      workspaceId:   workspace.id,
      clientId:      workspace.id,
      role:          'user',
      workspaceRole: 'owner',
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
    }
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[register]', detail);
    return NextResponse.json({ error: `Error al crear la cuenta: ${detail}` }, { status: 500 });
  }
}
