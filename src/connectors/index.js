/**
 * Capa unificada de connectors de redes sociales.
 *
 * connection_type: 'username' → scraping/API pública (hoy)
 * connection_type: 'oauth'    → token oficial (migración futura)
 *
 * La interfaz no cambia al migrar: fetchRecentContent(account) siempre
 * devuelve el mismo formato { platform, posts: [...] }.
 */

const youtube   = require('./youtube');
const instagram = require('./instagram');
const tiktok    = require('./tiktok');

const CONNECTORS = {
  youtube,
  instagram,
  tiktok,
  // x: require('./x'),      // futuro
  // facebook: require('./facebook'), // futuro
};

/**
 * Obtiene posts recientes de una cuenta.
 * @param {object} account - Fila de social_accounts
 * @returns {{ platform, posts: Post[] } | null}
 */
async function fetchRecentContent(account) {
  const connector = CONNECTORS[account.platform];
  if (!connector) {
    console.warn(`[Connectors] Sin conector para: ${account.platform}`);
    return null;
  }
  return connector.fetch(account);
}

/**
 * Obtiene posts de todas las cuentas de un creator.
 * @param {object[]} accounts - Filas de social_accounts
 * @returns {object[]} Array de { platform, posts }
 */
async function fetchAllAccounts(accounts) {
  const results = await Promise.allSettled(
    accounts.map(acc => fetchRecentContent(acc))
  );
  return results
    .filter(r => r.status === 'fulfilled' && r.value?.posts?.length)
    .map(r => r.value);
}

module.exports = { fetchRecentContent, fetchAllAccounts };
