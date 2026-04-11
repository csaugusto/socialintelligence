/**
 * DB — capa de datos
 *
 * Routing automático:
 *   DATABASE_URL presente → PostgreSQL (producción)
 *   Sin DATABASE_URL      → JSON en archivo (desarrollo)
 *
 * Todas las funciones aceptan workspaceId (antes clientId).
 * Los parámetros clientId siguen funcionando como alias para compatibilidad.
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

async function saveArticle({ nota, scores, ghostPost, clientId, workspaceId, trendContext }) {
  if (usingPg()) {
    const res = await getPool().query(
      `INSERT INTO articles
         (workspace_id, title, excerpt, category, decay_type, is_breaking, has_video,
          is_local, source_trend, tags, copy, hashtags, scores, trend_context, ghost_id, ghost_url,
          brief, angle)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        workspaceId || clientId || DEFAULT_CLIENT_ID,
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

async function getRecentKeywords(hours = 6, workspaceId) {
  if (usingPg()) {
    const res = await getPool().query(
      `SELECT source_trend FROM articles
       WHERE workspace_id = $1 AND created_at > NOW() - INTERVAL '${hours} hours'`,
      [workspaceId || DEFAULT_CLIENT_ID]
    );
    return res.rows.map(r => r.source_trend);
  }

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return jsonReadAll().filter(a => a.createdAt > cutoff).map(a => a.sourceTrend);
}

async function getRecentArticles(limit = 50, workspaceId) {
  if (usingPg()) {
    const res = await getPool().query(
      `SELECT * FROM articles WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [workspaceId || DEFAULT_CLIENT_ID, limit]
    );
    return res.rows;
  }

  return jsonReadAll().slice(0, limit);
}

// ---------------------------------------------------------------------------
// PARRILLA
// ---------------------------------------------------------------------------

async function addToParrilla({ articleId, articleTitle, network, scheduledFor, copy, hashtags, clientId, workspaceId }) {
  if (usingPg()) {
    const res = await getPool().query(
      `INSERT INTO parrilla (workspace_id, article_id, article_title, network, scheduled_for, copy, hashtags)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        workspaceId || clientId || DEFAULT_CLIENT_ID,
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

async function removeFromParrilla(id, workspaceId) {
  if (usingPg()) {
    await getPool().query(
      `DELETE FROM parrilla WHERE id = $1 AND workspace_id = $2`,
      [id, workspaceId || DEFAULT_CLIENT_ID]
    );
    return;
  }

  jsonWriteParrilla(jsonReadParrilla().filter(i => i.id !== id));
}

async function getParrilla(workspaceId) {
  if (usingPg()) {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const res = await getPool().query(
      `SELECT * FROM parrilla
       WHERE workspace_id = $1 AND scheduled_for > $2 AND status = 'pending'
       ORDER BY scheduled_for ASC`,
      [workspaceId || DEFAULT_CLIENT_ID, cutoff]
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
    `INSERT INTO workspaces (name, slug, type, coverage, region, vertical)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, slug, type, coverage, region || null, vertical]
  );
  return res.rows[0];
}

async function getClient(workspaceId) {
  if (!usingPg()) return { id: DEFAULT_CLIENT_ID, name: 'Default', slug: 'default' };
  const res = await getPool().query(`SELECT * FROM workspaces WHERE id = $1`, [workspaceId]);
  return res.rows[0] || null;
}

async function saveWizardData(workspaceId, data) {
  if (!usingPg()) throw new Error('saveWizardData requiere PostgreSQL (DATABASE_URL)');
  const pool = getPool();

  const nichos       = data.nicho || [];
  const mainCategory = nichos[0] || null;
  const platforms    = data.platforms || [];
  const primaryNet   = platforms[0] || null;
  const producesVideo = platforms.some(p => ['youtube', 'tiktok'].includes(p));

  // Upsert workspace_profiles con todos los campos del wizard
  await pool.query(
    `INSERT INTO workspace_profiles
       (workspace_id, categories, main_category, active_networks, primary_network,
        produces_video, objectives, content_pillars,
        posting_frequency, production_capacity, tone, tone_limits, content_patterns)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (workspace_id) DO UPDATE SET
       categories          = EXCLUDED.categories,
       main_category       = EXCLUDED.main_category,
       active_networks     = EXCLUDED.active_networks,
       primary_network     = EXCLUDED.primary_network,
       produces_video      = EXCLUDED.produces_video,
       objectives          = EXCLUDED.objectives,
       content_pillars     = EXCLUDED.content_pillars,
       posting_frequency   = EXCLUDED.posting_frequency,
       production_capacity = EXCLUDED.production_capacity,
       tone                = EXCLUDED.tone,
       tone_limits         = EXCLUDED.tone_limits,
       content_patterns    = COALESCE(EXCLUDED.content_patterns, workspace_profiles.content_patterns),
       updated_at          = NOW()`,
    [
      workspaceId,
      nichos,
      mainCategory,
      platforms,
      primaryNet,
      producesVideo,
      data.objectives || [],
      data.pillars || [],
      data.frequency || null,
      data.productionCapacity || null,
      data.tone ? [data.tone] : [],
      JSON.stringify({
        avoid_topics: data.toneAvoid || [],
        controversy_level: data.controversyLevel ?? 1,
      }),
      data.contentPatterns ? JSON.stringify(data.contentPatterns) : null,
    ]
  );

  // Guardar handle de YouTube si se analizó el canal
  if (data.youtubeHandle && data.contentPatterns) {
    const handle = data.youtubeHandle.startsWith('@') ? data.youtubeHandle : `@${data.youtubeHandle}`;
    await pool.query(
      `INSERT INTO social_accounts (workspace_id, platform, username, connection_type)
       VALUES ($1, 'youtube', $2, 'public')
       ON CONFLICT (workspace_id, platform) DO UPDATE SET username = EXCLUDED.username`,
      [workspaceId, handle]
    );
  }

  // Insertar competidores (limpia y reinserta)
  if (data.competitors && data.competitors.length > 0) {
    await pool.query(`DELETE FROM competitors WHERE workspace_id = $1`, [workspaceId]);
    for (const c of data.competitors) {
      await pool.query(
        `INSERT INTO competitors (workspace_id, handle, platform, label, display_name)
         VALUES ($1,$2,$3,$4,$5)`,
        [workspaceId, c.handle, c.platform, c.label, c.display_name || null]
      );
    }
  }
}

async function saveClientProfile(workspaceId, profile) {
  if (!usingPg()) throw new Error('saveClientProfile requiere PostgreSQL (DATABASE_URL)');
  const res = await getPool().query(
    `INSERT INTO workspace_profiles
       (workspace_id, categories, main_category, produces_video, covers_breaking,
        active_networks, primary_network, editorial_schedule, team_size,
        audience_age_range, known_peak_hours, profile_narrative)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (workspace_id) DO UPDATE SET
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
      workspaceId,
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

async function getClientProfile(workspaceId) {
  if (!usingPg()) return null;
  const res = await getPool().query(
    `SELECT * FROM workspace_profiles WHERE workspace_id = $1`, [workspaceId]
  );
  return res.rows[0] || null;
}

async function saveClientScorerConfig(workspaceId, config) {
  if (!usingPg()) throw new Error('saveClientScorerConfig requiere PostgreSQL (DATABASE_URL)');
  const res = await getPool().query(
    `INSERT INTO workspace_scorer_config
       (workspace_id, category_weights, hour_factors, day_multipliers,
        format_signals, production_time, enabled_networks)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (workspace_id) DO UPDATE SET
       category_weights = EXCLUDED.category_weights,
       hour_factors = EXCLUDED.hour_factors,
       day_multipliers = EXCLUDED.day_multipliers,
       format_signals = EXCLUDED.format_signals,
       production_time = EXCLUDED.production_time,
       enabled_networks = EXCLUDED.enabled_networks,
       updated_at = NOW()
     RETURNING *`,
    [
      workspaceId,
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

async function getClientScorerConfig(workspaceId) {
  if (!usingPg()) return null;
  const res = await getPool().query(
    `SELECT * FROM workspace_scorer_config WHERE workspace_id = $1`, [workspaceId]
  );
  return res.rows[0] || null;
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

async function updateClient(workspaceId, { name, slug, type, coverage, region, vertical, active }) {
  if (!usingPg()) throw new Error('updateClient requiere PostgreSQL');
  const res = await getPool().query(
    `UPDATE workspaces SET name=$1, slug=$2, type=$3, coverage=$4, region=$5, vertical=$6, active=$7
     WHERE id=$8 RETURNING *`,
    [name, slug, type, coverage, region || null, vertical || 'media', active ?? true, workspaceId]
  );
  return res.rows[0] || null;
}

async function updateUser(userId, { email, role, active, clientId, workspaceId }) {
  if (!usingPg()) throw new Error('updateUser requiere PostgreSQL');
  const pool = getPool();

  // Actualizar campos en users (email, active)
  const userFields = [];
  const userValues = [];
  let i = 1;
  if (email  !== undefined) { userFields.push(`email=$${i++}`);  userValues.push(email); }
  if (active !== undefined) { userFields.push(`active=$${i++}`); userValues.push(active); }

  let userRow = null;
  if (userFields.length > 0) {
    userValues.push(userId);
    const res = await pool.query(
      `UPDATE users SET ${userFields.join(', ')} WHERE id=$${i}
       RETURNING id, client_id, email, active, created_at`,
      userValues
    );
    userRow = res.rows[0] || null;
  }

  // Actualizar rol en workspace_members
  // workspaceId es opcional: si se omite, actualiza en todos los workspaces del usuario
  const wsId = workspaceId || clientId;
  let memberRole = null;
  if (role !== undefined) {
    if (wsId) {
      const res = await pool.query(
        `UPDATE workspace_members SET role = $1
         WHERE user_id = $2 AND workspace_id = $3
         RETURNING role`,
        [role, userId, wsId]
      );
      memberRole = res.rows[0]?.role;
    } else {
      // Sin workspace específico: actualizar el primer workspace del usuario
      const res = await pool.query(
        `UPDATE workspace_members SET role = $1
         WHERE user_id = $2
         RETURNING role`,
        [role, userId]
      );
      memberRole = res.rows[0]?.role;
    }
  }

  if (!userRow) {
    // Si solo se cambió el rol, traer el usuario para retornar datos completos
    const res = await pool.query(
      `SELECT id, client_id, email, active, created_at FROM users WHERE id = $1`,
      [userId]
    );
    userRow = res.rows[0] || null;
  }

  if (!userRow) return null;
  return { ...userRow, role: memberRole };
}

async function listAllClients() {
  if (!usingPg()) return [];
  const res = await getPool().query(
    `SELECT w.*,
       (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id)::int AS user_count,
       (SELECT COUNT(*) FROM articles a WHERE a.workspace_id = w.id)::int AS article_count,
       (SELECT COUNT(*) FROM workspace_profiles p WHERE p.workspace_id = w.id)::int AS has_profile
     FROM workspaces w
     ORDER BY w.created_at DESC`
  );
  return res.rows;
}

async function getUsersByClientId(workspaceId) {
  if (!usingPg()) return [];
  const res = await getPool().query(
    `SELECT u.id, u.email, u.name, u.active, u.created_at, m.role
     FROM workspace_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.workspace_id = $1
     ORDER BY u.created_at DESC`,
    [workspaceId]
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
/**
 * Registro self-service: crea workspace + usuario + lo agrega como owner.
 * Retorna { user, workspace }.
 */
async function getUserWorkspaces(userId) {
  if (!usingPg()) return [];
  const res = await getPool().query(
    `SELECT w.id, w.name, w.slug, w.type, w.vertical, w.logo_url, m.role AS workspace_role
     FROM workspace_members m
     JOIN workspaces w ON w.id = m.workspace_id
     WHERE m.user_id = $1
     ORDER BY m.created_at ASC`,
    [userId]
  );
  return res.rows;
}

async function updateWorkspaceBasic(workspaceId, { name, type }) {
  if (!usingPg()) throw new Error('updateWorkspaceBasic requiere PostgreSQL');
  const fields = [];
  const values = [];
  let i = 1;
  if (name !== undefined) { fields.push(`name=$${i++}`); values.push(name); }
  if (type !== undefined) { fields.push(`type=$${i++}`); values.push(type); }
  if (fields.length === 0) return null;
  values.push(workspaceId);
  const res = await getPool().query(
    `UPDATE workspaces SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`,
    values
  );
  return res.rows[0] || null;
}

async function createWorkspace({ userId, name, type = 'creator', vertical = 'creator' }) {
  if (!usingPg()) throw new Error('createWorkspace requiere PostgreSQL');
  const pool = getPool();

  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60) + '-' + Date.now().toString(36);

  const wsRes = await pool.query(
    `INSERT INTO workspaces (name, slug, type, vertical) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, slug, type, vertical]
  );
  const workspace = wsRes.rows[0];

  await pool.query(
    `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [workspace.id, userId]
  );

  return workspace;
}

async function registerUser({ name, email, password, workspaceName }) {
  if (!usingPg()) throw new Error('registerUser requiere PostgreSQL (DATABASE_URL)');
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que el email no esté tomado
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) throw new Error('EMAIL_TAKEN');

    // Generar slug del workspace
    const slug = workspaceName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60) + '-' + Date.now().toString(36);

    // Crear workspace
    const wsRes = await client.query(
      `INSERT INTO workspaces (name, slug, type, vertical) VALUES ($1, $2, 'creator', 'creator') RETURNING *`,
      [workspaceName, slug]
    );
    const workspace = wsRes.rows[0];

    // Crear usuario
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, name, client_id, role)
       VALUES ($1, crypt($2, gen_salt('bf', 10)), $3, $4, 'user')
       RETURNING id, email, name, role`,
      [email, password, name, workspace.id]
    );
    const user = userRes.rows[0];

    // Agregar como owner del workspace
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [workspace.id, user.id]
    );

    await client.query('COMMIT');
    return { user, workspace };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function createUser({ email, password, clientId, workspaceId, role = 'editor' }) {
  if (!usingPg()) throw new Error('createUser requiere PostgreSQL (DATABASE_URL)');
  const wsId = workspaceId || clientId || DEFAULT_CLIENT_ID;
  const client = await getPool();

  // Crear usuario global
  const userRes = await client.query(
    `INSERT INTO users (email, password_hash, client_id, role)
     VALUES ($1, crypt($2, gen_salt('bf', 10)), $3, 'user')
     RETURNING id, client_id, email, role, created_at`,
    [email, password, wsId]
  );
  const user = userRes.rows[0];

  // Agregar como miembro del workspace con el rol indicado
  await client.query(
    `INSERT INTO workspace_members (workspace_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (workspace_id, user_id) DO NOTHING`,
    [wsId, user.id, role]
  );

  return { ...user, role };
}

// ---------------------------------------------------------------------------
// SOCIAL ACCOUNTS
// ---------------------------------------------------------------------------

async function saveSocialAccount(workspaceId, { platform, username, channelId, connectionType = 'username', accessToken = null, refreshToken = null, tokenExpiresAt = null }) {
  const res = await getPool().query(
    `INSERT INTO social_accounts (workspace_id, platform, username, channel_id, connection_type, access_token, refresh_token, token_expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (workspace_id, platform) DO UPDATE SET
       username = EXCLUDED.username,
       channel_id = EXCLUDED.channel_id,
       connection_type = EXCLUDED.connection_type,
       access_token = COALESCE(EXCLUDED.access_token, social_accounts.access_token),
       refresh_token = COALESCE(EXCLUDED.refresh_token, social_accounts.refresh_token),
       token_expires_at = COALESCE(EXCLUDED.token_expires_at, social_accounts.token_expires_at)
     RETURNING *`,
    [workspaceId, platform, username || null, channelId || null, connectionType, accessToken, refreshToken, tokenExpiresAt]
  );
  return res.rows[0];
}

async function getSocialAccounts(workspaceId) {
  const res = await getPool().query(
    `SELECT * FROM social_accounts WHERE workspace_id = $1 ORDER BY created_at`,
    [workspaceId]
  );
  return res.rows;
}

async function deleteSocialAccount(workspaceId, platform) {
  await getPool().query(
    `DELETE FROM social_accounts WHERE workspace_id = $1 AND platform = $2`,
    [workspaceId, platform]
  );
}

async function getCompetitors(workspaceId) {
  if (!usingPg()) return [];
  const res = await getPool().query(
    `SELECT handle, platform, label, display_name FROM competitors WHERE workspace_id = $1 ORDER BY created_at`,
    [workspaceId]
  );
  return res.rows;
}

async function saveStudioContent(workspaceId, articleId, studioContent) {
  await getPool().query(
    `UPDATE articles SET studio_content = $1
     WHERE id = $2 AND workspace_id = $3`,
    [JSON.stringify(studioContent), articleId, workspaceId]
  );
}

async function getStudioContent(workspaceId, articleId) {
  const res = await getPool().query(
    `SELECT studio_content FROM articles WHERE id = $1 AND workspace_id = $2`,
    [articleId, workspaceId]
  );
  return res.rows[0]?.studio_content || null;
}

async function saveContentPatterns(workspaceId, patterns) {
  await getPool().query(
    `UPDATE workspace_profiles SET content_patterns = $1, updated_at = now() WHERE workspace_id = $2`,
    [JSON.stringify(patterns), workspaceId]
  );
}

/**
 * Guarda el perfil de IA compilado en workspaces.ai_profile.
 * Se llama al terminar el onboarding y al actualizar la configuración del workspace.
 */
async function saveAiProfile(workspaceId, aiProfile) {
  if (!usingPg()) return;
  await getPool().query(
    `UPDATE workspaces SET ai_profile = $1 WHERE id = $2`,
    [aiProfile, workspaceId]
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
  saveWizardData,
  saveClientProfile, getClientProfile,
  saveClientScorerConfig, getClientScorerConfig,
  // Users
  verifyUserPassword, createUser, registerUser,
  // Workspaces
  getUserWorkspaces, createWorkspace, updateWorkspaceBasic,
  // Admin
  listAllClients, getUsersByClientId, updateClient, updateUser,
  // Social accounts
  saveSocialAccount, getSocialAccounts, deleteSocialAccount, saveContentPatterns,
  getCompetitors,
  saveStudioContent, getStudioContent,
  // AI profile
  saveAiProfile,
  // Utils
  DEFAULT_CLIENT_ID,
};
