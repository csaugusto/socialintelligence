const axios = require('axios');

/**
 * Publica la nota en Ghost via Admin API.
 * Si no hay credenciales configuradas, opera en modo dry-run (solo log).
 */
async function publish(nota, scores, image = null) {
  const ghostUrl = process.env.GHOST_URL;
  const adminKey = process.env.GHOST_ADMIN_API_KEY;

  if (!ghostUrl || !adminKey) {
    console.warn('[Publisher] Ghost no configurado — modo dry-run');
    console.log('[Publisher] Nota que se publicaría:', nota.title);
    return { id: null, url: null, dryRun: true };
  }


  try {
    const [keyId, keySecret] = adminKey.split(':');
    const token = buildJWT(keyId, keySecret);

    const post = {
      title: nota.title,
      html: nota.content,
      excerpt: nota.excerpt,
      tags: nota.tags.map(t => ({ name: t })),
      status: 'published',
      meta_description: nota.excerpt,
    };

    if (image) {
      post.feature_image = image.url;
      post.feature_image_caption = `Foto: <a href="${image.authorUrl}" target="_blank">${image.authorName}</a> / Unsplash`;
    }

    const payload = { posts: [post] };

    const { data } = await axios.post(
      `${ghostUrl}/ghost/api/admin/posts/`,
      payload,
      {
        headers: {
          Authorization: `Ghost ${token}`,
          'Content-Type': 'application/json',
        },
        params: { source: 'html' },
      }
    );

    const published = data.posts[0];
    return { id: published.id, url: published.url, dryRun: false };

  } catch (err) {
    console.error('[Publisher] Error al publicar en Ghost:', err.response?.data || err.message);
    return { id: null, url: null, dryRun: true, error: err.message };
  }
}

function buildJWT(keyId, keySecret) {
  // JWT manual para Ghost Admin API (HS256)
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: keyId }));
  const payload = base64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }));
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', Buffer.from(keySecret, 'hex'))
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${payload}.${signature}`;
}

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

module.exports = { publish };
