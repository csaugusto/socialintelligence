import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroySession } from '@/lib/auth';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(req: NextRequest) {
  const { user, password } = await req.json();

  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      // 1. Verificar credenciales
      const userRes = await pool.query(
        `SELECT id, client_id, email, role
         FROM users
         WHERE email = $1
           AND password_hash = crypt($2, password_hash)
           AND active = TRUE`,
        [user, password]
      );

      if (!userRes.rows[0]) {
        await pool.end();
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
      }

      const dbUser = userRes.rows[0];

      // 2. Superadmin — sin workspace
      if (dbUser.role === 'superadmin') {
        await pool.end();
        await createSession({
          userId:        dbUser.id,
          workspaceId:   '',
          clientId:      '',
          role:          'superadmin',
          workspaceRole: 'owner',
        });
        return NextResponse.json({ ok: true });
      }

      // 3. Usuario normal — leer su workspace y rol desde workspace_members
      //    Toma el primer workspace al que pertenece (el principal)
      //    En el futuro el usuario elegirá en un selector de workspace
      const memberRes = await pool.query(
        `SELECT m.workspace_id, m.role AS workspace_role, w.vertical
         FROM workspace_members m
         JOIN workspaces w ON w.id = m.workspace_id
         WHERE m.user_id = $1
         ORDER BY m.created_at ASC
         LIMIT 1`,
        [dbUser.id]
      );

      await pool.end();

      const member = memberRes.rows[0];
      const workspaceId = member?.workspace_id || dbUser.client_id || DEFAULT_WORKSPACE_ID;
      const workspaceRole = member?.workspace_role || 'editor';

      await createSession({
        userId:        dbUser.id,
        workspaceId,
        clientId:      workspaceId,   // alias
        role:          'user',
        workspaceRole,
      });

      return NextResponse.json({ ok: true });

    } catch (err) {
      console.error('[auth] Error consultando DB:', err);
    }
  }

  // Fallback: env vars (desarrollo sin DB)
  if (
    user === process.env.DASHBOARD_USER &&
    password === process.env.DASHBOARD_PASSWORD
  ) {
    await createSession({
      userId:        'dev-user',
      workspaceId:   DEFAULT_WORKSPACE_ID,
      clientId:      DEFAULT_WORKSPACE_ID,
      role:          'user',
      workspaceRole: 'owner',
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
