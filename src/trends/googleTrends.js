const RSSParser = require('rss-parser');
const parser = new RSSParser();

const FEED_URL = 'https://trends.google.com/trending/rss?geo=MX';

async function fetch() {
  try {
    const feed = await parser.parseURL(FEED_URL);

    return feed.items.map((item, index) => ({
      keyword: item.title,
      source: 'google_trends',
      // Google ordena por relevancia: primero = más trending
      score: Math.max(100 - index * 5, 10),
      publishedAt: item.pubDate || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[GoogleTrends] Error al obtener feed:', err.message);
    return [];
  }
}

module.exports = { fetch };
