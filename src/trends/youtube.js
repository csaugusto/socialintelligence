const axios = require('axios');

// Mapeo nicho → YouTube category IDs
// https://developers.google.com/youtube/v3/docs/videoCategories/list
const NICHO_CATEGORIES = {
  entretenimiento: ['24', '23', '1'],   // Entertainment, Comedy, Film & Animation
  gaming:          ['20'],              // Gaming
  tecnologia:      ['28'],             // Science & Technology
  educacion:       ['27', '28'],        // Education, Science & Technology
  fitness:         ['26', '17'],        // Howto & Style, Sports
  moda:            ['26'],             // Howto & Style
  lifestyle:       ['22', '26'],        // People & Blogs, Howto & Style
  viajes:          ['19', '22'],        // Travel & Events, People & Blogs
  finanzas:        ['22', '27'],        // People & Blogs, Education
  gastronomia:     ['26', '22'],        // Howto & Style, People & Blogs
  negocios:        ['22', '27'],        // People & Blogs, Education
  otro:            ['0'],              // All categories
};

/**
 * Obtiene videos trending en YouTube MX para las categorías del nicho.
 * @param {string} nicho - main_category del creator
 */
async function fetch(nicho = 'entretenimiento') {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[YouTube] YOUTUBE_API_KEY no configurada, omitiendo fuente.');
    return [];
  }

  const categories = NICHO_CATEGORIES[nicho] || NICHO_CATEGORIES.otro;

  try {
    const requests = categories.map(categoryId =>
      axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode: 'MX',
          videoCategoryId: categoryId,
          maxResults: 10,
          key: apiKey,
        },
      }).then(r => r.data.items || []).catch(() => [])
    );

    const results = await Promise.all(requests);
    const videos = results.flat();

    const seen = new Set();
    return videos
      .filter(v => {
        if (!v.snippet?.title) return false;
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      })
      .map((video, index) => {
        const views     = parseInt(video.statistics?.viewCount || '0', 10);
        const likes     = parseInt(video.statistics?.likeCount || '0', 10);
        const channel   = video.snippet.channelTitle;
        const score     = Math.min(95, Math.max(40, 95 - index * 4));

        return {
          keyword:     video.snippet.title,
          source:      'youtube_trending',
          score,
          publishedAt: video.snippet.publishedAt,
          excerpt:     `Video trending en YouTube MX — Canal: ${channel} | ${formatViews(views)} vistas | ${formatViews(likes)} likes`,
          videoId:     video.id,
          channel,
          views,
          likes,
        };
      });

  } catch (err) {
    console.warn('[YouTube] Error:', err.message);
    return [];
  }
}

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

module.exports = { fetch };
