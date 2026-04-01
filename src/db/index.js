/**
 * DB — capa de datos
 *
 * Routing automático:
 *   DATABASE_URL presente → PostgreSQL (producción)
 *   Sin DATABASE_URL      → JSON en archivo (desarrollo)
 *
 * Todas las funciones tienen la misma firma en ambos modos.
 * client_id es opcional; si se omite usa el cliente default.
 */

const path = require('path');
const fs   = require('fs');

// ---------------------------------------------------------------------------
// POSTGRESQL — pool (lazy load para no romper entornos sin pg instalado)
// ---------------------------------------------------------------------------
let pool = null;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

function usingPg() {
  return !!getPool();
}

const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// JSON — rutas de archivos (desarrollo)
// ---------------------------------------------------------------------------
const DATA_FILE     = path.join(__dirname, '../../data/articles.json');
const PARRILLA_FILE = path.join(__dirname, '../../data/parrilla.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function jsonReadAll() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; }
}

function jsonWriteAll(articles) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
}

function jsonReadParrilla() {
  ensureDataDir();
  if (!fs.existsSync(PARRILLA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(PARRILLA_FILE, 'utf8')); } catch { return []; }
}

function jsonWriteParrilla(items) {
  ensureDataDir();
  fs.writeFileSync(PARRILLA_FILE, JSON.stringify(items, null, 2));
}

// ---------------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------------

async function saveArticle({ nota, scores, ghostPost, clientId, trendContext }) {
  if (usingPg()) {
    const res = await getPool().query(
      `INSERT INTO articles
         (client_id, title, excerpt, category, decay_type, is_breaking, has_video,
          is_local, source_trend, tags, copy, hashtags, scores, trend_context, ghost_id, ghost_url,
          brief, angle)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        clientId || DEFAULT_CLIENT_ID,
        nota.title, nota.excerpt, nota.category, nota.decayType,
        nota.isBreaking || false, nota.hasVideo || false, nota.isLocal !== false,
        nota.sourceTrend, nota.tags || [],
        JSON.stringify(nota.copy || null),
        JSON.stringify(nota.hashtags || null),
        JSON.stringify(scores),
        JSON.stringify(trendContext || null),
        ghostPost?.id || null, ghostPost?.url || null,
        JSON.stringify(nota.brief || null),
        nota.angle || null,
      ]
    );
    return res.rows[0];
  }

  // JSON
  const articles = jsonReadAll();
  const record = {
    id: Date.now().toString(),
    title: nota.title, excerpt: nota.excerpt, category: nota.category,
    decayType: nota.decayType, isBreaking: nota.isBreaking || false,
    hasVideo: nota.hasVideo || false, isLocal: nota.isLocal !== false,
    sourceTrend: nota.sourceTrend, tags: nota.tags,
    copy: nota.copy || null, hashtags: nota.hashtags || null,
    scores, trendContext: trendContext || null,
    ghostId: ghostPost?.id || null, ghostUrl: ghostPost?.url || null,
    createdAt: new Date().toISOString(),
  };
  articles.unshift(record);
  jsonWriteAll(articles.slice(0, 200));
  return record;
}

async function updateArticleScores(id, scores) {
  if (usingPg()) {
    const res = await getPool().query(
      `UPDATE articles SET scores = $1, reanalyzed_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(scores), id]
    );
    return res.rows[0] || null;
  }

  const articles = jsonReadAll();
  const idx = articles.findIndex(a => a.id === id);
  if (idx === -1) return null;
  articles[idx].scores = scores;
  articles[idx].reanalyzedAt = new Date().toISOString();
  jsonWriteAll(articles);
  return articles[idx];
}

async function getRecentKeywords(hours = 6, clientId) {
  if (usingPg()) {
    const res = await getPool().query(
      `SELECT source_trend FROM articles
       WHERE client_id = $1 AND created_at > NOW() - INTERVAL '${hours} hours'`,
      [clientId || DEFAULT_CLIENT_ID]
    );
    return res.rows.map(r => r.source_trend);
  }

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return jsonReadAll().filter(a => a.createdAt > cutoff).map(a => a.sourceTrend);
}

async function getRecentArticles(limit = 50, clientId) {
  if (usingPg()) {
    const res = await getPool().query(
      `SELECT * FROM articles WHERE client_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [clientId || DEFAULT_CLIENT_ID, limit]
    );
    return res.rows;
  }

  return jsonReadAll().slice(0, limit);
}

// ---------------------------------------------------------------------------
// PARRILLA
// ---------------------------------------------------------------------------

async function addToParrilla({ articleId, articleTitle, network, scheduledFor, copy, hashtags, clientId }) {
  if (usingPg()) {
    const res = await getPool().query(
      `INSERT INTO parrilla (client_id, article_id, article_title, network, scheduled_for, copy, hashtags)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        clientId || DEFAULT_CLIENT_ID,
        articleId, articleTitle, network, scheduledFor,
        copy || null, hashtags || [],
      ]
    );
    const item = res.rows[0];
    const allItems = await getParrilla(clientId);
    return { item, conflicts: detectConflicts(allItems, item) };
  }

  const items = jsonReadParrilla();
  const item = {
    id: Date.now().toString(), articleId, articleTitle, network,
    scheduledFor, copy: copy || null, hashtags: hashtags || [],
    addedAt: new Date().toISOString(),
  };
  items.push(item);
  items.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  jsonWriteParrilla(items);
  return { item, conflicts: detectConflicts(items, item) };
}

async function removeFromParrilla(id, clientId) {
  if (usingPg()) {
    await getPool().query(
      `DELETE FROM parrilla WHERE id = $1 AND client_id = $2`,
      [id, clientId || DEFAULT_CLIENT_ID]
    );
    return;
  }

  jsonWriteParrilla(jsonReadParrilla().filter(i => i.id !== id));
}

async function getParrilla(clientId) {
  if (usingPg()) {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const res = await getPool().query(
      `SELECT * FROM parrilla
       WHERE client_id = $1 AND scheduled_for > $2 AND status = 'pending'
       ORDER BY scheduled_for ASC`,
      [clientId || DEFAULT_CLIENT_ID, cutoff]
    );
    return res.rows.map(item => ({ ...item, conflicts: detectConflicts(res.rows, item) }));
  }

  const items = jsonReadParrilla();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const active = items.filter(i => i.scheduledFor > cutoff);
  if (active.length !== items.length) jsonWriteParrilla(active);
  return active.map(item => ({ ...item, conflicts: detectConflicts(active, item) }));
}

function detectConflicts(allItems, item) {
  const scheduledKey = item.scheduledFor || item.scheduled_for;
  const networkKey   = item.network;
  const itemHour = new Date(scheduledKey);
  itemHour.setMinutes(0, 0, 0);

  return allItems
    .filter(other => {
      if (other.id === item.id) return false;
      if (other.network !== networkKey) return false;
      const otherHour = new Date(other.scheduledFor || other.scheduled_for);
      otherHour.setMinutes(0, 0, 0);
      return otherHour.getTime() === itemHour.getTime();
    })
    .map(o => o.id);
}

function getSlotCount(network, isoHour, clientId) {
  if (usingPg()) {
    // Sincrónico no es posible con pg — el scorer llama esto de forma síncrona.
    // Retorna 0 con PG hasta que el scorer sea refactorizado para soportar async aquí.
    return 0;
  }

  const items = jsonReadParrilla();
  const slotStart = new Date(isoHour);
  slotStart.setMinutes(0, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
  return items.filter(i => {
    if (i.network !== network) return false;
    const t = new Date(i.scheduledFor);
    return t >= slotStart && t < slotEnd;
  }).length;
}

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------

async function saveClient({ name, slug, type, coverage, region, vertical = 'media' }) {
  if (!usingPg()) throw new Error('saveClient requiere PostgreSQL (DATABASE_URL)');
  const res = await getPool().query(
    `INSERT INTO clients (name, slug, type, coverage, region, vertical)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, slug, type, coverage, region || null, vertical]
  );
  return res.rows[0];
}

async function getClient(clientId) {
  if (!usingPg()) return { id: DEFAULT_CLIENT_ID, name: 'Default', slug: 'default' };
  const res = await getPool().query(`SELECT * FROM clients WHERE id = $1`, [clientId]);
  return res.rows[0] || null;
}

async function saveClientProfile(clientId, profile) {
  if (!usingPg()) throw new Error('saveClientProfile requiere PostgreSQL (DATABASE_URL)');
  const res = await getPool().query(
    `INSERT INTO client_profiles
       (client_id, categories, main_category, produces_video, covers_breaking,
        active_networks, primary_network, editorial_schedule, team_size,
        audience_age_range, known_peak_hours, profile_narrative)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (client_id) DO UPDATE SET
       categories = EXCLUDED.categories,
       main_category = EXCLUDED.main_category,
       produces_video = EXCLUDED.produces_video,
       covers_breaking = EXCLUDED.covers_breaking,
       active_networks = EXCLUDED.active_networks,
       primary_network = EXCLUDED.primary_network,
       editorial_schedule = EXCLUDED.editorial_schedule,
       team_size = EXCLUDED.team_size,
       audience_age_range = EXCLUDED.audience_age_range,
       known_peak_hours = EXCLUDED.known_peak_hours,
       profile_narrative = EXCLUDED.profile_narrative,
       updated_at = NOW()
     RETURNING *`,
    [
      clientId,
      profile.categories || [],
      profile.main_category || null,
      profile.produces_video || false,
      profile.covers_breaking || false,
      profile.active_networks || [],
      profile.primary_network || null,
      JSON.stringify(profile.editorial_schedule || null),
      profile.team_size || null,
      profile.audience_age_range || null,
      JSON.stringify(profile.known_peak_hours || null),
      profile.profile_narrative || null,
    ]
  );
  return res.rows[0];
}

async function getClientProfile(clientId) {
  if (!usingPg()) return null;
  const res = await getPool().query(
    `SELECT * FROM client_profiles WHERE client_id = $1`, [clientId]
  );
  return res.rows[0] || null;
}

async function saveClientScorerConfig(clientId, config) {
  if (!usingPg()) throw new Error('saveClientScorerConfig requiere PostgreSQL (DATABASE_URL)');
  const res = await getPool().query(
    `INSERT INTO client_scorer_config
       (client_id, category_weights, hour_factors, day_multipliers,
        format_signals, production_time, enabled_networks)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (client_id) DO UPDATE SET
       category_weights = EXCLUDED.category_weights,
       hour_factors = EXCLUDED.hour_factors,
       day_multipliers = EXCLUDED.day_multipliers,
       format_signals = EXCLUDED.format_signals,
       production_time = EXCLUDED.production_time,
       enabled_networks = EXCLUDED.enabled_networks,
       updated_at = NOW()
     RETURNING *`,
    [
      clientId,
      JSON.stringify(config.category_weights || null),
      JSON.stringify(config.hour_factors || null),
      JSON.stringify(config.day_multipliers || null),
      JSON.stringify(config.format_signals || null),
      JSON.stringify(config.production_time || null),
      config.enabled_networks || ['instagram', 'x', 'facebook', 'tiktok'],
    ]
  );
  return res.rows[0];
}

async function getClientScorerConfig(clientId) {
  if (!usingPg()) return null;
  const res = await getPool().query(
    `SELECT * FROM client_scorer_config WHERE client_id = $1`, [clientId]
  );
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

async function updateClient(clientId, { name, slug, type, coverage, region, vertical, active }) {
  if (!usingPg()) throw new Error('updateClient requiere PostgreSQL');
  const res = await getPool().query(
    `UPDATE clients SET name=$1, slug=$2, type=$3, coverage=$4, region=$5, vertical=$6, active=$7
     WHERE id=$8 RETURNING *`,
    [name, slug, type, coverage, region || null, vertical || 'media', active ?? true, clientId]
  );
  return res.rows[0] || null;
}

async function updateUser(userId, { email, role, active, clientId }) {
  if (!usingPg()) throw new Error('updateUser requiere PostgreSQL');
  // Construir el SET dinámicamente para solo actualizar los campos que vienen
  const fields = [];
  const values = [];
  let i = 1;
  if (email     !== undefined) { fields.push(`email=$${i++}`);     values.push(email); }
  if (role      !== undefined) { fields.push(`role=$${i++}`);      values.push(role); }
  if (active    !== undefined) { fields.push(`active=$${i++}`);    values.push(active); }
  if (clientId  !== undefined) { fields.push(`client_id=$${i++}`); values.push(clientId); }
  if (fields.length === 0) throw new Error('Nada que actualizar');
  values.push(userId);
  const res = await getPool().query(
    `UPDATE users SET ${fields.join(', ')} WHERE id=$${i}
     RETURNING id, client_id, email, role, active, created_at`,
    values
  );
  return res.rows[0] || null;
}

async function listAllClients() {
  if (!usingPg()) return [];
  const res = await getPool().query(
    `SELECT c.*,
       (SELECT COUNT(*) FROM users    u WHERE u.client_id = c.id AND u.role != 'superadmin')::int AS user_count,
       (SELECT COUNT(*) FROM articles a WHERE a.client_id = c.id)::int AS article_count,
       (SELECT COUNT(*) FROM client_profiles p WHERE p.client_id = c.id)::int AS has_profile
     FROM clients c
     ORDER BY c.created_at DESC`
  );
  return res.rows;
}

async function getUsersByClientId(clientId) {
  if (!usingPg()) return [];
  const res = await getPool().query(
    `SELECT id, email, role, active, created_at FROM users
     WHERE client_id = $1 AND role != 'superadmin'
     ORDER BY created_at DESC`,
    [clientId]
  );
  return res.rows;
}

/**
 * Verifica email + contraseña usando pgcrypto (crypt).
 * Retorna el registro del usuario si las credenciales son correctas, null si no.
 */
async function verifyUserPassword(email, password) {
  if (!usingPg()) return null;
  const res = await getPool().query(
    `SELECT id, client_id, email, role
     FROM users
     WHERE email = $1
       AND password_hash = crypt($2, password_hash)
       AND active = TRUE`,
    [email, password]
  );
  return res.rows[0] || null;
}

/**
 * Crea un usuario nuevo. La contraseña se hashea con pgcrypto (bcrypt, factor 10).
 */
async function createUser({ email, password, clientId, role = 'editor' }) {
  if (!usingPg()) throw new Error('createUser requiere PostgreSQL (DATABASE_URL)');
  const res = await getPool().query(
    `INSERT INTO users (email, password_hash, client_id, role)
     VALUES ($1, crypt($2, gen_salt('bf', 10)), $3, $4)
     RETURNING id, client_id, email, role, created_at`,
    [email, password, clientId || DEFAULT_CLIENT_ID, role]
  );
  return res.rows[0];
}

// ---------------------------------------------------------------------------
// SOCIAL ACCOUNTS
// ---------------------------------------------------------------------------

async function saveSocialAccount(clientId, { platform, username, channelId, connectionType = 'username', accessToken = null, refreshToken = null, tokenExpiresAt = null }) {
  const res = await getPool().query(
    `INSERT INTO social_accounts (client_id, platform, username, channel_id, connection_type, access_token, refresh_token, token_expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (client_id, platform) DO UPDATE SET
       username = EXCLUDED.username,
       channel_id = EXCLUDED.channel_id,
       connection_type = EXCLUDED.connection_type,
       access_token = COALESCE(EXCLUDED.access_token, social_accounts.access_token),
       refresh_token = COALESCE(EXCLUDED.refresh_token, social_accounts.refresh_token),
       token_expires_at = COALESCE(EXCLUDED.token_expires_at, social_accounts.token_expires_at)
     RETURNING *`,
    [clientId, platform, username || null, channelId || null, connectionType, accessToken, refreshToken, tokenExpiresAt]
  );
  return res.rows[0];
}

async function getSocialAccounts(clientId) {
  const res = await getPool().query(
    `SELECT * FROM social_accounts WHERE client_id = $1 ORDER BY created_at`,
    [clientId]
  );
  return res.rows;
}

async function deleteSocialAccount(clientId, platform) {
  await getPool().query(
    `DELETE FROM social_accounts WHERE client_id = $1 AND platform = $2`,
    [clientId, platform]
  );
}

async function saveContentPatterns(clientId, patterns) {
  await getPool().query(
    `UPDATE client_profiles SET content_patterns = $1, updated_at = now() WHERE client_id = $2`,
    [JSON.stringify(patterns), clientId]
  );
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------
module.exports = {
  // Articles
  saveArticle, updateArticleScores, getRecentKeywords, getRecentArticles,
  // Parrilla
  addToParrilla, removeFromParrilla, getParrilla, getSlotCount,
  // Clients
  saveClient, getClient,
  saveClientProfile, getClientProfile,
  saveClientScorerConfig, getClientScorerConfig,
  // Users
  verifyUserPassword, createUser,
  // Admin
  listAllClients, getUsersByClientId, updateClient, updateUser,
  // Social accounts
  saveSocialAccount, getSocialAccounts, deleteSocialAccount, saveContentPatterns,
  // Utils
  DEFAULT_CLIENT_ID,
};
