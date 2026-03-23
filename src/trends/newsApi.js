const axios = require('axios');

const BASE_URL = 'https://newsapi.org/v2/everything';

// Queries para cubrir distintos temas de noticias MX
const QUERIES = ['México noticias', 'México política', 'México seguridad'];

async function fetch() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('[NewsAPI] NEWS_API_KEY no configurada, omitiendo fuente.');
    return [];
  }

  try {
    const results = await Promise.all(
      QUERIES.map(q =>
        axios.get(BASE_URL, {
          params: {
            q,
            language: 'es',
            pageSize: 10,
            sortBy: 'publishedAt',
            apiKey,
          },
        }).then(r => r.data.articles || []).catch(() => [])
      )
    );

    const articles = results.flat();
    const seen = new Set();

    return articles
      .filter(a => {
        if (!a.title || a.title === '[Removed]') return false;
        if (seen.has(a.title)) return false;
        seen.add(a.title);
        return true;
      })
      .map((article, index) => ({
        keyword: article.title,
        source: 'newsapi',
        score: Math.max(85 - index * 3, 10),
        publishedAt: article.publishedAt,
        excerpt: article.description || '',
        url: article.url,
      }));
  } catch (err) {
    console.warn('[NewsAPI] Error:', err.message);
    return [];
  }
}

module.exports = { fetch };
