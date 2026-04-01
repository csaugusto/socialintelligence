const googleTrends = require('./googleTrends');
const db = require('../db');

/**
 * Obtiene trends de todas las fuentes, deduplica y filtra los ya cubiertos.
 * Devuelve array de topics ordenados por relevancia.
 */
async function fetch() {
  const [googleResults] = await Promise.allSettled([
    googleTrends.fetch(),
  ]);

  const allTopics = [
    ...(googleResults.status === 'fulfilled' ? googleResults.value : []),
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
  const map = new Map();
  for (const topic of topics) {
    const key = normalize(topic.keyword);
    if (map.has(key)) {
      const existing = map.get(key);
      if (!existing.sources.includes(topic.source)) {
        existing.sources.push(topic.source);
      }
      existing.score = Math.max(existing.score, topic.score);
    } else {
      map.set(key, { ...topic, sources: [topic.source] });
    }
  }
  return Array.from(map.values()).map(t => ({
    ...t,
    crossSource: t.sources.length > 1,
  }));
}

function isCovered(keyword, coveredKeywords) {
  const kw = normalize(keyword);
  return coveredKeywords.some(c => normalize(c).includes(kw) || kw.includes(normalize(c)));
}

function normalize(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

module.exports = { fetch };
