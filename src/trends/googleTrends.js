const RSSParser = require('rss-parser');
const parser = new RSSParser();

// Mapeo nicho → categoría de Google Trends
// https://trends.google.com/trending/rss?geo=MX&cat=<cat>
const NICHO_TO_CAT = {
  entretenimiento: 'e',   // Entertainment
  gaming:          'e',   // Entertainment (incluye gaming)
  moda:            'e',   // Entertainment
  lifestyle:       'e',   // Entertainment
  tecnologia:      't',   // Sci/Tech
  educacion:       't',   // Sci/Tech
  fitness:         'h',   // Health
  gastronomia:     'h',   // Health (food)
  finanzas:        'b',   // Business
  negocios:        'b',   // Business
  viajes:          '',    // Travel no tiene cat propia, usamos all
  otro:            '',    // All
};

/**
 * Obtiene trends de Google Trends MX, opcionalmente filtrados por nicho.
 * @param {string} [nicho] - Nicho del creator para filtrar por categoría
 */
async function fetch(nicho) {
  const cat = nicho ? (NICHO_TO_CAT[nicho] ?? '') : '';
  const url = `https://trends.google.com/trending/rss?geo=MX${cat ? `&cat=${cat}` : ''}`;

  try {
    const feed = await parser.parseURL(url);

    return feed.items.map((item, index) => ({
      keyword:     item.title,
      source:      'google_trends',
      score:       Math.max(100 - index * 5, 10),
      publishedAt: item.pubDate || new Date().toISOString(),
      excerpt:     item.contentSnippet || '',
    }));
  } catch (err) {
    console.warn('[GoogleTrends] Error al obtener feed:', err.message);
    return [];
  }
}

module.exports = { fetch };
