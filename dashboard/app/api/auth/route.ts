import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, password } = await req.json();

  if (
    user === process.env.DASHBOARD_USER &&
    password === process.env.DASHBOARD_PASSWORD
  ) {
    await createSession();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
