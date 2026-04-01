const axios = require('axios');

// TikTok Creative Center — requiere autenticación (40101 no permission)
// Módulo deshabilitado hasta conseguir acceso oficial
const BASE = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
};

// Mapeo nicho → industry_id de TikTok Creative Center
// IDs aproximados — TikTok no los documenta públicamente
const NICHO_TO_INDUSTRY = {
  entretenimiento: null,   // sin filtro = all, entertainment está distribuido
  gaming:          null,
  tecnologia:      null,
  educacion:       null,
  fitness:         null,
  moda:            null,
  lifestyle:       null,
  viajes:          null,
  finanzas:        null,
  gastronomia:     null,
  negocios:        null,
  otro:            null,
};

async function fetchHashtags(nicho = '') {
  try {
    const { data } = await axios.get(`${BASE}/hashtag/list`, {
      headers: HEADERS,
      params: {
        page:         1,
        limit:        20,
        period:       7,          // últimos 7 días
        country_code: 'MX',
      },
      timeout: 8000,
    });

    const items = data?.data?.list || [];
    return items.map((item, index) => ({
      keyword:     `#${item.hashtag_name || item.name}`,
      source:      'tiktok_trends',
      score:       Math.max(90 - index * 3, 20),
      publishedAt: new Date().toISOString(),
      excerpt:     item.publish_cnt
        ? `${formatNum(item.publish_cnt)} videos en TikTok esta semana`
        : 'Hashtag trending en TikTok MX',
      videoCount:  item.publish_cnt || 0,
    }));
  } catch (err) {
    console.warn('[TikTok] Error en hashtags:', err.message);
    return [];
  }
}

async function fetchSongs() {
  try {
    const { data } = await axios.get(`${BASE}/sound/list`, {
      headers: HEADERS,
      params: {
        page:         1,
        limit:        10,
        period:       7,
        country_code: 'MX',
      },
      timeout: 8000,
    });

    const items = data?.data?.list || [];
    return items.map((item, index) => ({
      keyword:     item.clip_title || item.title || 'Sonido trending',
      source:      'tiktok_trends',
      score:       Math.max(85 - index * 4, 20),
      publishedAt: new Date().toISOString(),
      excerpt:     `Sonido trending en TikTok MX — ${item.author || ''}${item.publish_cnt ? ` | ${formatNum(item.publish_cnt)} videos` : ''}`,
      videoCount:  item.publish_cnt || 0,
    }));
  } catch (err) {
    console.warn('[TikTok] Error en sonidos:', err.message);
    return [];
  }
}

async function fetch() {
  console.warn('[TikTok] API requiere autenticación — fuente deshabilitada.');
  return [];
}

function formatNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

module.exports = { fetch };
