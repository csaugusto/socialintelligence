/**
 * Capa de base de datos.
 * Por ahora opera en memoria para desarrollo local sin PostgreSQL.
 * Cuando DATABASE_URL esté configurado, usa pg.
 */

const { Pool } = require('pg');

let pool = null;
const inMemoryArticles = [];

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

async function saveArticle({ nota, scores, ghostPost }) {
  const record = {
    title: nota.title,
    category: nota.category,
    decayType: nota.decayType,
    sourceTrend: nota.sourceTrend,
    scores,
    ghostId: ghostPost?.id,
    ghostUrl: ghostPost?.url,
    createdAt: new Date().toISOString(),
  };

  const db = getPool();
  if (!db) {
    inMemoryArticles.push(record);
    return record;
  }

  const { rows } = await db.query(
    `INSERT INTO articles (title, category, decay_type, source_trend, scores, ghost_id, ghost_url, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
    [nota.title, nota.category, nota.decayType, nota.sourceTrend, JSON.stringify(scores), ghostPost?.id, ghostPost?.url]
  );
  return rows[0];
}

/**
 * Devuelve keywords de notas publicadas en las últimas N horas.
 * Evita cubrir el mismo trend dos veces.
 */
async function getRecentKeywords(hours = 6) {
  const db = getPool();
  if (!db) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    return inMemoryArticles
      .filter(a => a.createdAt > cutoff)
      .map(a => a.sourceTrend);
  }

  const { rows } = await db.query(
    `SELECT source_trend FROM articles WHERE created_at > NOW() - INTERVAL '${hours} hours'`
  );
  return rows.map(r => r.source_trend);
}

async function getRecentArticles(limit = 20) {
  const db = getPool();
  if (!db) {
    return inMemoryArticles.slice(-limit).reverse();
  }

  const { rows } = await db.query(
    `SELECT * FROM articles ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { saveArticle, getRecentKeywords, getRecentArticles };
