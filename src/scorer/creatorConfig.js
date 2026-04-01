/**
 * Convierte el perfil de un creator en configuración para el scorer.
 * - Solo scoreea las redes donde el creator publica
 * - Boost de +12 pts en la red principal
 * - Pesos base ajustados por nicho de creator (no por categorías de noticias)
 */

// Índices en el array de pesos: [instagram, x, facebook, tiktok]
const NET_IDX = { instagram: 0, x: 1, facebook: 2, tiktok: 3 };

// Pesos base por nicho creator (relevancia de cada red para ese nicho)
const NICHO_WEIGHTS = {
  //                     IG    X    FB   TK
  entretenimiento:    [ 90,  60,  70,  95],
  gaming:             [ 72,  68,  58,  94],
  tecnologia:         [ 74,  82,  62,  70],
  educacion:          [ 80,  65,  68,  80],
  fitness:            [ 84,  55,  70,  86],
  moda:               [ 92,  50,  65,  90],
  lifestyle:          [ 88,  52,  68,  88],
  gastronomia:        [ 90,  52,  70,  86],
  viajes:             [ 92,  55,  70,  82],
  finanzas:           [ 68,  80,  65,  62],
  negocios:           [ 70,  78,  66,  68],
  otro:               [ 75,  65,  65,  75],
};

/**
 * @param {object} profile - Perfil del creator de la DB
 * @returns {object} clientConfig listo para pasar a scorer.score()
 */
function buildCreatorConfig(profile) {
  const primaryNet   = profile.primary_network || 'instagram';
  const activeNets   = (profile.active_networks || [primaryNet])
    .filter(n => n in NET_IDX); // solo redes que el scorer conoce
  const scorableNets = activeNets.length ? activeNets : ['instagram'];

  const primaryIdx = NET_IDX[primaryNet] ?? 0;
  const nicho      = profile.main_category || 'otro';
  const baseWeights = NICHO_WEIGHTS[nicho] || NICHO_WEIGHTS.otro;

  // Boost +12 en red principal, cap a 100
  const boostedWeights = baseWeights.map((w, idx) =>
    idx === primaryIdx ? Math.min(100, w + 12) : w
  );

  // El scorer espera un objeto { categoria: [ig, x, fb, tk] }
  // Usamos el nicho del creator como categoría universal para sus ideas
  const category_weights = {};
  for (const cat of Object.keys(NICHO_WEIGHTS)) {
    // Para otras categorías también aplicamos el boost de red principal
    const base = NICHO_WEIGHTS[cat];
    category_weights[cat] = base.map((w, idx) =>
      idx === primaryIdx ? Math.min(100, w + 12) : w
    );
  }

  return {
    enabled_networks:  scorableNets,
    category_weights,
    profile_narrative: profile.profile_narrative || null,
  };
}

module.exports = { buildCreatorConfig };
