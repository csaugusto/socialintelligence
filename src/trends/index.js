const googleTrends = require('./googleTrends');
const newsApi = require('./newsApi');
const db = require('../db');

/**
 * Obtiene trends de todas las fuentes, deduplica y filtra los ya cubiertos.
 * Devuelve array de topics ordenados por relevancia.
 */
async function fetch() {
  const [googleResults, newsResults] = await Promise.allSettled([
    googleTrends.fetch(),
    newsApi.fetch(),
  ]);

  const allTopics = [
    ...(googleResults.status === 'fulfilled' ? googleResults.value : []),
    ...(newsResults.status === 'fulfilled' ? newsResults.value : []),
  ];

  if (!allTopics.length) return [];

  // Deduplicar por keyword similar
  const unique = deduplicate(allTopics);

  // Filtrar los que ya tienen nota publicada en las últimas 6 horas
  const covered = await db.getRecentKeywords(6);
  const fresh = unique.filter(t => !isCovered(t.keyword, covered));

  // Ordenar por score de relevancia (mayor primero)
  return fresh.sort((a, b) => b.score - a.score);
}

function deduplicate(topics) {
  const seen = new Set();
  return topics.filter(t => {
    const key = normalize(t.keyword);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isCovered(keyword, coveredKeywords) {
  const kw = normalize(keyword);
  return coveredKeywords.some(c => normalize(c).includes(kw) || kw.includes(normalize(c)));
}

function normalize(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

module.exports = { fetch };
