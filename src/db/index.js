const path = require('path');
const fs = require('fs');

const DATA_FILE     = path.join(__dirname, '../../data/articles.json');
const PARRILLA_FILE = path.join(__dirname, '../../data/parrilla.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------------
function readAll() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; }
}

function writeAll(articles) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
}

async function saveArticle({ nota, scores, ghostPost }) {
  const articles = readAll();
  const record = {
    id: Date.now().toString(),
    title: nota.title,
    excerpt: nota.excerpt,
    category: nota.category,
    decayType: nota.decayType,
    isBreaking: nota.isBreaking || false,
    hasVideo: nota.hasVideo || false,
    isLocal: nota.isLocal !== false,
    sourceTrend: nota.sourceTrend,
    tags: nota.tags,
    copy: nota.copy || null,
    hashtags: nota.hashtags || null,
    scores,
    ghostId: ghostPost?.id || null,
    ghostUrl: ghostPost?.url || null,
    createdAt: new Date().toISOString(),
  };
  articles.unshift(record);
  writeAll(articles.slice(0, 200));
  return record;
}

async function updateArticleScores(id, scores) {
  const articles = readAll();
  const idx = articles.findIndex(a => a.id === id);
  if (idx === -1) return null;
  articles[idx].scores = scores;
  articles[idx].reanalyzedAt = new Date().toISOString();
  writeAll(articles);
  return articles[idx];
}

async function getRecentKeywords(hours = 6) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return readAll().filter(a => a.createdAt > cutoff).map(a => a.sourceTrend);
}

async function getRecentArticles(limit = 50) {
  return readAll().slice(0, limit);
}

// ---------------------------------------------------------------------------
// PARRILLA
// ---------------------------------------------------------------------------
function readParrilla() {
  ensureDataDir();
  if (!fs.existsSync(PARRILLA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(PARRILLA_FILE, 'utf8')); } catch { return []; }
}

function writeParrilla(items) {
  ensureDataDir();
  fs.writeFileSync(PARRILLA_FILE, JSON.stringify(items, null, 2));
}

async function addToParrilla({ articleId, articleTitle, network, scheduledFor, copy, hashtags }) {
  const items = readParrilla();
  const item = {
    id: Date.now().toString(),
    articleId,
    articleTitle,
    network,
    scheduledFor, // ISO string
    copy: copy || null,
    hashtags: hashtags || [],
    addedAt: new Date().toISOString(),
  };
  items.push(item);
  // Ordenar por fecha
  items.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  writeParrilla(items);
  return { item, conflicts: detectConflicts(items, item) };
}

async function removeFromParrilla(id) {
  const items = readParrilla().filter(i => i.id !== id);
  writeParrilla(items);
}

async function getParrilla() {
  const items = readParrilla();
  // Limpiar slots ya pasados (más de 2 horas atrás)
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const active = items.filter(i => i.scheduledFor > cutoff);
  if (active.length !== items.length) writeParrilla(active);
  return active.map(item => ({
    ...item,
    conflicts: detectConflicts(active, item),
  }));
}

/**
 * Detecta conflictos: dos o más posts en la misma red dentro de la misma hora.
 * Devuelve array de IDs que entran en conflicto con el item dado.
 */
function detectConflicts(allItems, item) {
  const itemHour = new Date(item.scheduledFor);
  itemHour.setMinutes(0, 0, 0);

  return allItems
    .filter(other => {
      if (other.id === item.id) return false;
      if (other.network !== item.network) return false;
      const otherHour = new Date(other.scheduledFor);
      otherHour.setMinutes(0, 0, 0);
      return otherHour.getTime() === itemHour.getTime();
    })
    .map(o => o.id);
}

/**
 * Cuántos posts hay programados en una red para un slot horario dado.
 * Usado por el scorer para penalizar saturación.
 */
function getSlotCount(network, isoHour) {
  const items = readParrilla();
  const slotStart = new Date(isoHour);
  slotStart.setMinutes(0, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

  return items.filter(i => {
    if (i.network !== network) return false;
    const t = new Date(i.scheduledFor);
    return t >= slotStart && t < slotEnd;
  }).length;
}

module.exports = {
  saveArticle, updateArticleScores, getRecentKeywords, getRecentArticles,
  addToParrilla, removeFromParrilla, getParrilla, getSlotCount,
};
