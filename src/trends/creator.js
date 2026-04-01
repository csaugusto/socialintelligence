const googleTrends = require('./googleTrends');
const youtube      = require('./youtube');
const reddit       = require('./reddit');
const db           = require('../db');

/**
 * Obtiene trends relevantes para un creator: Google Trends (por categoría), YouTube y TikTok.
 * @param {object} profile - Perfil del creator (main_category, categories, ...)
 */
async function fetch(profile = {}) {
  const nicho = profile.main_category || 'entretenimiento';

  const [googleResults, youtubeResults, redditResults] = await Promise.allSettled([
    googleTrends.fetch(nicho),
    youtube.fetch(nicho),
    reddit.fetch(nicho),
  ]);

  const google = googleResults.status  === 'fulfilled' ? googleResults.value  : [];
  const yt     = youtubeResults.status === 'fulfilled' ? youtubeResults.value : [];
  const rd     = redditResults.status  === 'fulfilled' ? redditResults.value  : [];

  console.log(`[Trends/Creator] Google: ${google.length} | YouTube (${nicho}): ${yt.length} | Reddit: ${rd.length}`);

  const allTopics = [...google, ...yt, ...rd];
  if (!allTopics.length) return [];

  const unique  = deduplicate(allTopics);
  const covered = await db.getRecentKeywords(6);
  const fresh   = unique.filter(t => !isCovered(t.keyword, covered));

  // Orden: TikTok y YouTube primero (más relevantes para creator), luego Google
  const CREATOR_SOURCES = ['youtube_trending', 'reddit'];
  return fresh.sort((a, b) => {
    const aIsCreator = CREATOR_SOURCES.includes(a.source) ? 1 : 0;
    const bIsCreator = CREATOR_SOURCES.includes(b.source) ? 1 : 0;
    if (aIsCreator !== bIsCreator) return bIsCreator - aIsCreator;
    return b.score - a.score;
  });
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
