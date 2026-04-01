/**
 * Connector Instagram.
 *
 * connection_type: 'username' → análisis de posts ingresados manualmente por el creator
 * connection_type: 'oauth'    → Instagram Graph API (futuro — requiere Facebook App Review)
 *
 * Sin OAuth, Instagram no permite acceso programático a perfiles públicos.
 * La estrategia MVP: el creator pega sus mejores captions/descripciones en el perfil.
 * Esos textos se guardan en social_accounts.username como JSON stringificado.
 *
 * Migración a OAuth:
 *   1. Agregar Facebook App con permiso instagram_basic + instagram_content_publish
 *   2. Guardar access_token en social_accounts
 *   3. fetchWithOAuth() ya está esbozado
 */

async function fetch(account) {
  if (account.connection_type === 'oauth' && account.access_token) {
    return fetchWithOAuth(account);
  }

  return fetchManual(account);
}

function fetchManual(account) {
  // El creator ingresa sus mejores posts como texto libre
  // Se guarda en la columna 'username' como JSON: [{caption, likes, format}, ...]
  if (!account.username) return { platform: 'instagram', posts: [] };

  let posts = [];
  try {
    posts = JSON.parse(account.username);
  } catch {
    // Si no es JSON, tratarlo como un solo caption de texto libre
    posts = [{ title: account.username, description: account.username, format: 'post', views: 0, likes: 0, comments: 0 }];
  }

  return {
    platform: 'instagram',
    posts: posts.map((p, i) => ({
      id:          `ig_manual_${i}`,
      title:       p.caption || p.title || `Post ${i + 1}`,
      description: p.caption || p.description || '',
      publishedAt: p.date || new Date().toISOString(),
      url:         p.url || null,
      views:       p.reach   || p.views    || 0,
      likes:       p.likes   || 0,
      comments:    p.comments || 0,
      format:      p.format  || 'post',  // post | reel | story | carrusel
      durationSec: p.durationSec || 0,
    })),
  };
}

// Placeholder OAuth — implementar cuando se tenga Facebook App aprobada
async function fetchWithOAuth(account) {
  // TODO: GET https://graph.instagram.com/me/media
  //   ?fields=id,caption,media_type,timestamp,like_count,comments_count
  //   &access_token=account.access_token
  console.warn('[Connector/Instagram] OAuth pendiente de implementar.');
  return { platform: 'instagram', posts: [] };
}

module.exports = { fetch };
