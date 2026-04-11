/**
 * migrate.js — Runner de migraciones SQL
 *
 * Lee todos los archivos src/db/migrations/*.sql en orden numérico,
 * aplica solo los que no han sido ejecutados aún y los registra en
 * la tabla schema_migrations.
 *
 * Uso: node src/db/migrate.js
 */

require('dotenv').config();

const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[Migrate] DATABASE_URL no configurada.');
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Crear tabla de control si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Leer migraciones disponibles ordenadas
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (!files.length) {
      console.log('[Migrate] Sin archivos de migración.');
      return;
    }

    // Ver cuáles ya están aplicadas
    const { rows } = await pool.query('SELECT filename FROM schema_migrations');
    const applied   = new Set(rows.map(r => r.filename));

    const pending = files.filter(f => !applied.has(f));

    if (!pending.length) {
      console.log('[Migrate] Base de datos al día. Sin migraciones pendientes.');
      return;
    }

    console.log(`[Migrate] ${pending.length} migración(es) pendiente(s):`);

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      const sql      = fs.readFileSync(filePath, 'utf8');

      console.log(`  → Aplicando ${file}...`);
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      console.log(`  ✓ ${file} aplicada`);
    }

    console.log('[Migrate] Listo.');

  } catch (err) {
    console.error('[Migrate] Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
