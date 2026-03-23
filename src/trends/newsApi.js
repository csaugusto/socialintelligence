const axios = require('axios');

const BASE_URL = 'https://newsapi.org/v2/top-headlines';

async function fetch() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('[NewsAPI] NEWS_API_KEY no configurada, omitiendo fuente.');
    return [];
  }

  try {
    const { data } = await axios.get(BASE_URL, {
      params: {
        country: 'mx',
        language: 'es',
        pageSize: 20,
        apiKey,
      },
    });

    return (data.articles || []).map((article, index) => ({
      keyword: article.title,
      source: 'newsapi',
      score: Math.max(90 - index * 4, 10),
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
