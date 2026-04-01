/**
 * Connector TikTok.
 *
 * connection_type: 'username' → no disponible (API requiere auth)
 * connection_type: 'oauth'    → TikTok for Developers Content API (futuro)
 *
 * Migración a OAuth:
 *   1. Crear app en developers.tiktok.com
 *   2. Solicitar scope: user.info.basic, video.list
 *   3. Guardar access_token en social_accounts
 *   4. fetchWithOAuth() implementa GET https://open.tiktokapis.com/v2/video/list/
 */

async function fetch(account) {
  if (account.connection_type === 'oauth' && account.access_token) {
    return fetchWithOAuth(account);
  }

  console.warn('[Connector/TikTok] Sin OAuth — no hay acceso a perfiles TikTok.');
  return { platform: 'tiktok', posts: [] };
}

// Placeholder OAuth
async function fetchWithOAuth(account) {
  // TODO: POST https://open.tiktokapis.com/v2/video/list/
  //   Authorization: Bearer account.access_token
  //   body: { max_count: 20 }
  console.warn('[Connector/TikTok] OAuth pendiente de implementar.');
  return { platform: 'tiktok', posts: [] };
}

module.exports = { fetch };
