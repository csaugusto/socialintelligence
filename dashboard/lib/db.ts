/**
 * Capa de acceso a datos para el dashboard (server components y API routes).
 * Usa pg directamente — no depende del módulo raíz src/db/index.js.
 */
import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function getClientProfile(clientId: string) {
  const p = getPool();
  if (!p) return null;
  const res = await p.query(
    'SELECT * FROM client_profiles WHERE client_id = $1',
    [clientId]
  );
  return res.rows[0] || null;
}

export async function getClient(clientId: string) {
  const p = getPool();
  if (!p) return null;
  const res = await p.query('SELECT * FROM clients WHERE id = $1', [clientId]);
  return res.rows[0] || null;
}
