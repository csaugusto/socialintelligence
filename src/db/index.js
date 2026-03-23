const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '../../data/articles.json');

// Asegurar que el directorio existe
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAll() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(articles) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
}

async function saveArticle({ nota, scores, ghostPost, image }) {
  const articles = readAll();
  const record = {
    id: Date.now().toString(),
    title: nota.title,
    excerpt: nota.excerpt,
    category: nota.category,
    decayType: nota.decayType,
    sourceTrend: nota.sourceTrend,
    tags: nota.tags,
    scores,
    ghostId: ghostPost?.id || null,
    ghostUrl: ghostPost?.url || null,
    image: image || null,
    createdAt: new Date().toISOString(),
  };
  articles.unshift(record); // más recientes primero
  // Mantener máximo 200 artículos en el archivo
  writeAll(articles.slice(0, 200));
  return record;
}

async function getRecentKeywords(hours = 6) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return readAll()
    .filter(a => a.createdAt > cutoff)
    .map(a => a.sourceTrend);
}

async function getRecentArticles(limit = 50) {
  return readAll().slice(0, limit);
}

module.exports = { saveArticle, getRecentKeywords, getRecentArticles };
