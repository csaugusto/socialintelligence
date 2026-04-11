import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { workspaceId } = await req.json();
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 });

  // Verificar que el usuario pertenece a ese workspace
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const res = await pool.query(
    `SELECT m.role, w.id, w.vertical
     FROM workspace_members m
     JOIN workspaces w ON w.id = m.workspace_id
     WHERE m.user_id = $1 AND m.workspace_id = $2`,
    [session.userId, workspaceId]
  );
  await pool.end();

  if (!res.rows[0]) {
    return NextResponse.json({ error: 'No tienes acceso a ese workspace' }, { status: 403 });
  }

  const member = res.rows[0];

  await createSession({
    userId:        session.userId,
    workspaceId:   member.id,
    clientId:      member.id,
    role:          session.role,
    workspaceRole: member.role,
  });

  return NextResponse.json({ ok: true });
}
