/**
 * Onboarding Processor — genera configuración personalizada del scorer por cliente
 *
 * A partir de las respuestas del cuestionario de onboarding produce:
 *   1. scorerConfig  — overrides parciales para las constantes del scorer
 *   2. profileNarrative — string de identidad editorial para el system prompt de Groq
 *
 * Se integra con db.saveClientProfile y db.saveClientScorerConfig para persistir
 * la configuración en PostgreSQL.
 */

const db = require('../db');

// ---------------------------------------------------------------------------
// DEFAULTS DEL SCORER (copiados para poder calcular overrides)
// ---------------------------------------------------------------------------

// Pesos por categoría [instagram, x, facebook, tiktok]
const DEFAULT_CATEGORY_WEIGHTS = {
  seguridad:       [ 70,  92,  88,  42],
  politica:        [ 48,  90,  72,  38],
  economia:        [ 42,  85,  62,  28],
  deportes:        [ 84,  88,  72,  88],
  entretenimiento: [ 90,  65,  74,  95],
  tecnologia:      [ 76,  84,  64,  72],
  salud:           [ 74,  62,  85,  70],
  cultura:         [ 85,  55,  68,  80],
  internacional:   [ 50,  84,  60,  42],
  default:         [ 50,  55,  52,  45],
};

const DEFAULT_FORMAT_SIGNALS = {
  instagram: { isBreaking:  0, hasVideo:  +8, isAnalysis:  -6, isEvergreen:  +8 },
  x:         { isBreaking:+15, hasVideo:  +3, isAnalysis:  +5, isEvergreen:  -5 },
  facebook:  { isBreaking: +3, hasVideo:  +7, isAnalysis:  +5, isEvergreen:  +3 },
  tiktok:    { isBreaking:-15, hasVideo: +12, isAnalysis: -10, isEvergreen:  +5 },
};

const DEFAULT_PRODUCTION_TIME = { instagram: 20, x: 2, facebook: 15, tiktok: 120 };

// Mapas de nombres en español para la narrativa editorial
const TIPO_NOMBRES = {
  radio:     'estación de radio',
  tv:        'canal de televisión',
  digital:   'medio digital',
  portal:    'portal de noticias',
  revista:   'revista digital',
  otro:      'medio de comunicación',
};

const CAT_NOMBRES = {
  politica:        'Política',
  economia:        'Economía',
  seguridad:       'Seguridad',
  deportes:        'Deportes',
  entretenimiento: 'Entretenimiento',
  tecnologia:      'Tecnología',
  salud:           'Salud',
  cultura:         'Cultura',
  internacional:   'Internacional',
};

const RED_NOMBRES = {
  instagram: 'Instagram',
  x:         'X (Twitter)',
  facebook:  'Facebook',
  tiktok:    'TikTok',
};

// ---------------------------------------------------------------------------
// 1. generateScorerConfig
// ---------------------------------------------------------------------------

/**
 * Recibe las respuestas del cuestionario y produce un objeto de overrides
 * parciales para el scorer. Solo incluye claves que difieren de los defaults.
 *
 * @param {object} answers
 * @returns {object} scorerConfig con overrides listos para fusionar en el scorer
 */
function generateScorerConfig(answers) {
  const config = {};

  // --- CATEGORY_WEIGHTS: boost de +20 a la categoría principal del cliente ---
  if (answers.main_category && DEFAULT_CATEGORY_WEIGHTS[answers.main_category]) {
    const categoryWeights = {};

    for (const [cat, pesos] of Object.entries(DEFAULT_CATEGORY_WEIGHTS)) {
      if (cat === answers.main_category) {
        // Aplica boost de +20 con capping en 100
        categoryWeights[cat] = pesos.map(p => Math.min(100, p + 20));
      } else {
        categoryWeights[cat] = [...pesos];
      }
    }

    config.category_weights = categoryWeights;
  }

  // --- FORMAT_SIGNALS: ajuste por capacidad de producción de video ---
  if (answers.produces_video === false || answers.covers_breaking === false) {
    // Partimos de una copia de los defaults y solo tocamos lo necesario
    const formatSignals = {
      instagram: { ...DEFAULT_FORMAT_SIGNALS.instagram },
      x:         { ...DEFAULT_FORMAT_SIGNALS.x },
      facebook:  { ...DEFAULT_FORMAT_SIGNALS.facebook },
      tiktok:    { ...DEFAULT_FORMAT_SIGNALS.tiktok },
    };

    // Sin producción de video → TikTok penaliza menos el hasVideo (de +12 a +6)
    if (answers.produces_video === false) {
      formatSignals.tiktok.hasVideo = +6;
    }

    // Sin cobertura de breaking → X baja el bonus de isBreaking (de +15 a +8)
    if (answers.covers_breaking === false) {
      formatSignals.x.isBreaking = +8;
    }

    config.format_signals = formatSignals;
  }

  // --- HOUR_FACTORS: picos personalizados si el cliente los conoce ---
  if (answers.known_peak_hours && typeof answers.known_peak_hours === 'object') {
    config.hour_factors = answers.known_peak_hours;
  }

  // --- enabled_networks: solo las redes activas del cliente ---
  if (Array.isArray(answers.active_networks) && answers.active_networks.length > 0) {
    config.enabled_networks = answers.active_networks;
  }

  // --- PRODUCTION_TIME: ajuste por tamaño del equipo ---
  if (answers.team_size != null) {
    const size = parseInt(answers.team_size, 10);

    if (size === 1) {
      config.production_time = {
        ...DEFAULT_PRODUCTION_TIME,
        instagram: 30,
        tiktok:    180,
      };
    } else if (size >= 2 && size <= 3) {
      config.production_time = {
        ...DEFAULT_PRODUCTION_TIME,
        instagram: 25,
        tiktok:    150,
      };
    }
    // 4+ personas: usa los defaults, no se incluye override
  }

  return config;
}

// ---------------------------------------------------------------------------
// 2. generateProfileNarrative
// ---------------------------------------------------------------------------

/**
 * Genera el string de identidad editorial que se inyecta en el system prompt
 * de Groq para personalizar el razonamiento del scorer por cliente.
 *
 * @param {object} answers
 * @param {string} clientName
 * @param {string} clientType  — radio | tv | digital | portal | revista | otro
 * @param {string} clientCoverage — ej. "cobertura regional"
 * @param {string} clientRegion  — ej. "Guadalajara"
 * @returns {string}
 */
function generateProfileNarrative(answers, clientName, clientType, clientCoverage, clientRegion) {
  const partes = [];

  // Identidad base: quién eres
  const tipoNombre = TIPO_NOMBRES[clientType] || TIPO_NOMBRES.otro;
  let identidad = `Eres editor digital de ${clientName}, ${tipoNombre}`;
  if (clientCoverage && clientRegion) {
    identidad += ` con ${clientCoverage} en ${clientRegion}`;
  } else if (clientCoverage) {
    identidad += ` con ${clientCoverage}`;
  } else if (clientRegion) {
    identidad += ` con sede en ${clientRegion}`;
  }
  identidad += '.';
  partes.push(identidad);

  // Categoría principal
  if (answers.main_category) {
    const catNombre = CAT_NOMBRES[answers.main_category] || answers.main_category;
    partes.push(`Tu categoría principal es ${catNombre}.`);
  }

  // Red prioritaria y redes activas secundarias
  if (answers.primary_network) {
    const redPrincipal = RED_NOMBRES[answers.primary_network] || answers.primary_network;
    partes.push(`Red prioritaria: ${redPrincipal}.`);

    // Redes secundarias: activas menos la primaria
    if (Array.isArray(answers.active_networks)) {
      const secundarias = answers.active_networks
        .filter(r => r !== answers.primary_network)
        .map(r => RED_NOMBRES[r] || r);

      if (secundarias.length > 0) {
        partes.push(`También activo en ${secundarias.join(', ')}.`);
      }
    }
  }

  // Capacidad de producción de video
  if (answers.produces_video === false) {
    partes.push('No produces video propio.');
  } else if (answers.produces_video === true) {
    partes.push('Produces video propio.');
  }

  // Cobertura de breaking news
  if (answers.covers_breaking === true) {
    partes.push('Cubres noticias de última hora.');
  } else if (answers.covers_breaking === false) {
    partes.push('No cubres noticias de última hora.');
  }

  // Horario editorial
  if (answers.editorial_schedule?.start && answers.editorial_schedule?.end) {
    partes.push(`Horario editorial: ${answers.editorial_schedule.start} a ${answers.editorial_schedule.end}.`);
  }

  return partes.join(' ');
}

// ---------------------------------------------------------------------------
// 3. processQuestionnaire
// ---------------------------------------------------------------------------

/**
 * Orquesta la generación de configuración y la persistencia en base de datos.
 *
 * @param {string} clientId
 * @param {object} answers
 * @param {string} clientName
 * @param {string} clientType
 * @param {string} clientCoverage
 * @param {string} clientRegion
 * @returns {Promise<{ scorerConfig: object, profileNarrative: string }>}
 */
async function processQuestionnaire(clientId, answers, clientName, clientType, clientCoverage, clientRegion) {
  // 1. Genera la configuración del scorer
  const scorerConfig = generateScorerConfig(answers);

  // 2. Genera la narrativa editorial
  const profileNarrative = generateProfileNarrative(answers, clientName, clientType, clientCoverage, clientRegion);

  // 3. Guarda el perfil del cliente en DB (incluye la narrativa)
  await db.saveClientProfile(clientId, { ...answers, profile_narrative: profileNarrative });

  // 4. Guarda la configuración del scorer en DB
  await db.saveClientScorerConfig(clientId, scorerConfig);

  return { scorerConfig, profileNarrative };
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CREATOR INTELLIGENCE
// ---------------------------------------------------------------------------

// Formatos → señales de producción (producción en minutos)
const FORMATO_PROD_TIME = {
  video_corto: { instagram: 60, tiktok: 45, facebook: 60, x: 30 },
  video_largo: { instagram: 120, tiktok: 120, facebook: 120, x: 60 },
  foto:        { instagram: 20, tiktok: 30, facebook: 20, x: 10 },
  texto:       { instagram: 15, x: 5, facebook: 15, tiktok: 20 },
  audio:       { instagram: 30, x: 15, facebook: 30, tiktok: 30 },
  stories:     { instagram: 10, facebook: 10, tiktok: 10, x: 10 },
};

// Nichos → pesos de categoría equivalentes para el scorer
const NICHO_CATEGORY_MAP = {
  lifestyle:       'entretenimiento',
  tecnologia:      'tecnologia',
  entretenimiento: 'entretenimiento',
  educacion:       'cultura',
  fitness:         'salud',
  finanzas:        'economia',
  gaming:          'entretenimiento',
  moda:            'entretenimiento',
  gastronomia:     'cultura',
  viajes:          'cultura',
  negocios:        'economia',
};

function generateCreatorScorerConfig(answers) {
  const config = {};

  // Redes activas del creador (incluyendo youtube y linkedin si aplica)
  if (answers.active_networks?.length > 0) {
    // Mapear youtube/linkedin a las redes conocidas del scorer
    const scorerNets = answers.active_networks.filter(n =>
      ['instagram', 'x', 'facebook', 'tiktok'].includes(n)
    );
    if (scorerNets.length > 0) config.enabled_networks = scorerNets;
  }

  // Tiempos de producción basados en formatos declarados
  if (answers.formatos?.length > 0) {
    // Toma el formato más demandante como referencia
    const tiempos = answers.formatos
      .map(f => FORMATO_PROD_TIME[f])
      .filter(Boolean);

    if (tiempos.length > 0) {
      const maxTiempos = {};
      for (const red of ['instagram', 'x', 'facebook', 'tiktok']) {
        maxTiempos[red] = Math.max(...tiempos.map(t => t[red] || 30));
      }
      config.production_time = maxTiempos;
    }
  }

  // Category weights basado en nicho principal
  if (answers.main_nicho) {
    const categoriaEquivalente = NICHO_CATEGORY_MAP[answers.main_nicho];
    if (categoriaEquivalente) {
      const weights = {};
      for (const [nicho, cat] of Object.entries(NICHO_CATEGORY_MAP)) {
        if (answers.nichos?.includes(nicho)) {
          weights[cat] = weights[cat]
            ? weights[cat].map((v, i) => Math.max(v, (nicho === answers.main_nicho ? 95 : 75) - i * 5))
            : [nicho === answers.main_nicho ? 95 : 75, 70, 65, 80];
        }
      }
      if (Object.keys(weights).length > 0) config.category_weights = weights;
    }
  }

  // Frecuencia → ajuste de horarios (frecuencia alta = más slots disponibles)
  if (answers.frecuencia === 'diaria') {
    config.format_signals = { video: +10, image: +5 };
  } else if (answers.frecuencia === 'quincenal') {
    config.format_signals = { video: +5, image: +8 }; // más cuidado, menos volumen
  }

  return config;
}

function generateCreatorProfileNarrative(answers, creatorName) {
  const partes = [];

  partes.push(`Eres estratega de contenido de ${creatorName}, creador digital.`);

  if (answers.main_nicho) {
    const nichoLabel = answers.main_nicho.charAt(0).toUpperCase() + answers.main_nicho.slice(1);
    partes.push(`Tu nicho principal es ${nichoLabel}.`);
  }

  if (answers.formatos?.length > 0) {
    const fmts = answers.formatos.map(f => ({
      video_corto: 'video corto', video_largo: 'video largo',
      foto: 'foto y carrusel', texto: 'texto y threads',
      audio: 'audio y podcast', stories: 'stories',
    }[f] || f));
    partes.push(`Produces: ${fmts.join(', ')}.`);
  }

  if (answers.primary_network) {
    const redNombre = { instagram: 'Instagram', tiktok: 'TikTok', x: 'X/Twitter',
      youtube: 'YouTube', facebook: 'Facebook', linkedin: 'LinkedIn' }[answers.primary_network] || answers.primary_network;
    partes.push(`Red principal: ${redNombre}.`);
  }

  if (answers.audience_size) {
    const sizeLabel = { nano: 'nano (menos de 10k)', micro: 'micro (10k–100k)',
      macro: 'macro (100k–1M)', mega: 'mega (más de 1M)' }[answers.audience_size] || answers.audience_size;
    partes.push(`Audiencia ${sizeLabel}.`);
  }

  if (answers.frecuencia) {
    partes.push(`Frecuencia de publicación: ${answers.frecuencia}.`);
  }

  return partes.join(' ');
}

module.exports = {
  generateScorerConfig, generateProfileNarrative, processQuestionnaire,
  generateCreatorScorerConfig, generateCreatorProfileNarrative,
};

// ---------------------------------------------------------------------------
// BLOQUE DE PRUEBA — solo se ejecuta si se llama directamente: node processor.js
// ---------------------------------------------------------------------------

if (require.main === module) {
  const answersEjemplo = {
    categories:        ['politica', 'seguridad'],
    main_category:     'politica',
    produces_video:    false,
    covers_breaking:   true,
    active_networks:   ['x', 'facebook', 'instagram'],
    primary_network:   'x',
    editorial_schedule: { start: '06:00', end: '23:00', days: [1, 2, 3, 4, 5] },
    team_size:         2,
    audience_age_range: '25-44',
    known_peak_hours:  null,
  };

  const scorerConfig    = generateScorerConfig(answersEjemplo);
  const profileNarrative = generateProfileNarrative(
    answersEjemplo,
    'Radio Noticias MX',
    'radio',
    'cobertura regional',
    'Guadalajara'
  );

  console.log('\n=== scorerConfig ===');
  console.log(JSON.stringify(scorerConfig, null, 2));

  console.log('\n=== profileNarrative ===');
  console.log(profileNarrative);
}
