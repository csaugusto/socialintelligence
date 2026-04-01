/**
 * Connector YouTube.
 *
 * connection_type: 'username' → YouTube Data API v3 (pública, usa YOUTUBE_API_KEY)
 * connection_type: 'oauth'    → YouTube Analytics API (métricas privadas, futuro)
 *
 * Post format estándar:
 * { id, title, description, publishedAt, url, views, likes, comments, format }
 */

const axios = require('axios');

const BASE = 'https://www.googleapis.com/youtube/v3';

async function fetch(account) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[Connector/YouTube] YOUTUBE_API_KEY no configurada.');
    return { platform: 'youtube', posts: [] };
  }

  if (account.connection_type === 'oauth' && account.access_token) {
    return fetchWithOAuth(account);
  }

  return fetchPublic(account, apiKey);
}

async function fetchPublic(account, apiKey) {
  try {
    // 1. Resolver username → channelId
    const channelId = account.channel_id || await resolveChannelId(account.username, apiKey);
    if (!channelId) {
      console.warn(`[Connector/YouTube] No se encontró canal para: ${account.username}`);
      return { platform: 'youtube', posts: [] };
    }

    // 2. Obtener videos recientes por viewCount
    const searchRes = await axios.get(`${BASE}/search`, {
      params: {
        channelId,
        type: 'video',
        order: 'viewCount',
        maxResults: 20,
        part: 'snippet',
        key: apiKey,
      },
      timeout: 8000,
    });

    const items = searchRes.data.items || [];
    if (!items.length) return { platform: 'youtube', posts: [] };

    // 3. Obtener estadísticas de esos videos
    const ids = items.map(v => v.id.videoId).join(',');
    const statsRes = await axios.get(`${BASE}/videos`, {
      params: { id: ids, part: 'statistics,contentDetails', key: apiKey },
      timeout: 8000,
    });

    const statsMap = {};
    (statsRes.data.items || []).forEach(v => { statsMap[v.id] = v; });

    const posts = items.map(item => {
      const vid   = statsMap[item.id.videoId] || {};
      const stats = vid.statistics || {};
      const duration = vid.contentDetails?.duration || '';
      const seconds  = parseDuration(duration);

      return {
        id:          item.id.videoId,
        title:       item.snippet.title,
        description: item.snippet.description?.slice(0, 300) || '',
        publishedAt: item.snippet.publishedAt,
        url:         `https://youtube.com/watch?v=${item.id.videoId}`,
        views:       parseInt(stats.viewCount  || '0', 10),
        likes:       parseInt(stats.likeCount  || '0', 10),
        comments:    parseInt(stats.commentCount || '0', 10),
        format:      seconds <= 60 ? 'short' : seconds <= 600 ? 'medium' : 'long',
        durationSec: seconds,
      };
    });

    console.log(`[Connector/YouTube] ${posts.length} videos obtenidos para ${account.username}`);
    return { platform: 'youtube', channelId, posts };

  } catch (err) {
    console.warn('[Connector/YouTube] Error:', err.message);
    return { platform: 'youtube', posts: [] };
  }
}

// Placeholder para cuando se implemente OAuth
async function fetchWithOAuth(account) {
  console.warn('[Connector/YouTube] OAuth no implementado aún — usando API pública.');
  return fetchPublic(account, process.env.YOUTUBE_API_KEY);
}

async function resolveChannelId(username, apiKey) {
  if (!username) return null;
  const handle = username.startsWith('@') ? username : `@${username}`;

  try {
    const res = await axios.get(`${BASE}/channels`, {
      params: { forHandle: handle, part: 'id', key: apiKey },
      timeout: 6000,
    });
    return res.data.items?.[0]?.id || null;
  } catch {
    return null;
  }
}

function parseDuration(iso) {
  // PT1H2M3S → segundos
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 3600) +
         (parseInt(match[2] || 0) * 60) +
          parseInt(match[3] || 0);
}

module.exports = { fetch };
