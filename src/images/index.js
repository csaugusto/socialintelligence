const axios = require('axios');

const BASE_URL = 'https://api.unsplash.com/search/photos';

// Keywords de búsqueda por categoría (en inglés para mejores resultados)
const CATEGORY_QUERIES = {
  politica:        'politics government mexico',
  economia:        'economy finance business',
  seguridad:       'police security law enforcement',
  deportes:        'sports mexico stadium',
  entretenimiento: 'entertainment concert show',
  tecnologia:      'technology digital innovation',
  salud:           'health medicine hospital',
  cultura:         'culture art mexico',
  internacional:   'world news international',
};

/**
 * Busca una imagen relevante en Unsplash para la nota.
 * Devuelve { url, authorName, authorUrl } o null si no encuentra.
 */
async function fetch(nota) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn('[Images] UNSPLASH_ACCESS_KEY no configurada.');
    return null;
  }

  // Intentar primero con keyword del trend, luego con categoría
  const queries = [
    nota.sourceTrend,
    CATEGORY_QUERIES[nota.category] || 'mexico news',
  ];

  for (const query of queries) {
    const image = await search(query, accessKey);
    if (image) return image;
  }

  return null;
}

async function search(query, accessKey) {
  try {
    const { data } = await axios.get(BASE_URL, {
      params: {
        query,
        per_page: 5,
        orientation: 'landscape',
        content_filter: 'high',
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    const results = data.results || [];
    if (!results.length) return null;

    // Tomar la primera imagen con buena resolución
    const photo = results[0];
    return {
      url: photo.urls.regular,
      authorName: photo.user.name,
      authorUrl: photo.user.links.html,
    };
  } catch (err) {
    console.warn('[Images] Error buscando imagen:', err.message);
    return null;
  }
}

module.exports = { fetch };
