const axios = require('axios');

// Subreddits por nicho — mezcla de MX/LATAM + nicho específico
const NICHO_SUBREDDITS = {
  entretenimiento: ['mexico', 'entertainment', 'movies', 'television', 'memes'],
  gaming:          ['mexico', 'gaming', 'Games', 'pcgaming'],
  tecnologia:      ['mexico', 'technology', 'gadgets', 'artificial'],
  educacion:       ['mexico', 'education', 'learnspanish', 'todayilearned'],
  fitness:         ['mexico', 'fitness', 'bodyweightfitness', 'nutrition'],
  moda:            ['mexico', 'femalefashionadvice', 'malefashionadvice', 'streetwear'],
  lifestyle:       ['mexico', 'lifestyle', 'selfimprovement', 'minimalism'],
  viajes:          ['mexico', 'travel', 'solotravel', 'backpacking'],
  finanzas:        ['mexico', 'personalfinance', 'investing', 'financaspessoais'],
  gastronomia:     ['mexico', 'food', 'MexicanFood', 'recipes'],
  negocios:        ['mexico', 'entrepreneur', 'smallbusiness', 'startups'],
  otro:            ['mexico', 'popular'],
};

const HEADERS = {
  'User-Agent': 'SocialIntelligence/1.0 (content research bot)',
};

/**
 * Obtiene posts trending de Reddit para el nicho del creator.
 * @param {string} nicho - Nicho principal del creator
 */
async function fetch(nicho = 'entretenimiento') {
  const subreddits = NICHO_SUBREDDITS[nicho] || NICHO_SUBREDDITS.otro;

  const requests = subreddits.map(sub =>
    axios.get(`https://www.reddit.com/r/${sub}/hot.json`, {
      params: { limit: 8 },
      headers: HEADERS,
      timeout: 6000,
    })
    .then(r => (r.data?.data?.children || []).map(c => c.data))
    .catch(() => [])
  );

  const results = await Promise.all(requests);
  const posts   = results.flat();

  const seen = new Set();
  return posts
    .filter(p => {
      if (!p.title || p.stickied || p.over_18) return false;
      if (p.score < 50) return false;  // mínimo engagement
      if (seen.has(p.title)) return false;
      seen.add(p.title);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((post, index) => ({
      keyword:     post.title,
      source:      'reddit',
      score:       Math.max(88 - index * 4, 20),
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
      excerpt:     `r/${post.subreddit} — ${formatNum(post.score)} upvotes · ${formatNum(post.num_comments)} comentarios`,
      subreddit:   post.subreddit,
      upvotes:     post.score,
    }));
}

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

module.exports = { fetch };
