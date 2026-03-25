/**
 * Scorer — basado en research general de industria
 * Fuentes: Sprout Social 2024, HubSpot State of Social, Later, Hootsuite, Buffer
 *
 * Dos scores por red (0–100):
 *   - Contenido: ¿qué tan bien encaja ESTA categoría en ESTA red?
 *   - Momento:   ¿es un buen momento para publicar AHORA?
 */

// ---------------------------------------------------------------------------
// PESOS POR CATEGORÍA [instagram, x, facebook, tiktok]
// Basados en engagement rate promedio por tipo de contenido en cada plataforma.
// ---------------------------------------------------------------------------
const CATEGORY_WEIGHTS = {
  //              IG    X    FB   TK
  seguridad:    [ 70,  92,  88,  42],  // X y FB lideran; TikTok no alcanza a producir
  politica:     [ 48,  90,  72,  38],  // X es la red del debate político
  economia:     [ 42,  85,  62,  28],  // X domina; TikTok audiencia poco receptiva
  deportes:     [ 84,  88,  72,  88],  // X para live, IG para highlights, TK para clips virales
  entretenimiento: [90, 65, 74, 95],   // TikTok e IG claramente lideran
  tecnologia:   [ 76,  84,  64,  72],  // X e IG fuertes; FB flojo en tech
  salud:        [ 74,  62,  85,  70],  // FB lidera (audiencia mayor/familia); IG también fuerte
  cultura:      [ 85,  55,  68,  80],  // IG y TikTok son plataformas visuales/culturales
  internacional:[ 50,  84,  60,  42],  // X domina noticias internacionales
  default:      [ 50,  55,  52,  45],
};

// ---------------------------------------------------------------------------
// PEAKS DE AUDIENCIA POR HORA (factor 0.0–1.0)
// Sprout Social 2024 + ajuste LATAM (GMT-6)
// ---------------------------------------------------------------------------
const HOUR_FACTORS = {
  instagram: {
    11: 1.00, 12: 0.98, 10: 0.88, 14: 0.85,
    19: 0.90, 20: 0.88, 13: 0.80,
  },
  x: {
     9: 1.00, 12: 0.92, 13: 0.90, 17: 0.88,
    18: 0.85,  8: 0.82, 20: 0.78,
  },
  facebook: {
     9: 1.00, 10: 0.95, 13: 0.90, 14: 0.88,
    15: 0.85, 19: 0.80,  8: 0.78,
  },
  tiktok: {
    20: 1.00, 19: 0.97, 21: 0.95, 12: 0.88,
    13: 0.85,  7: 0.80, 22: 0.78,
  },
};

// ---------------------------------------------------------------------------
// MULTIPLICADOR POR DÍA DE LA SEMANA (0=dom … 6=sáb)
// ---------------------------------------------------------------------------
const DAY_MULTIPLIERS = {
  //          dom   lun   mar   mié   jue   vie   sáb
  instagram: [0.72, 0.85, 1.00, 0.98, 0.95, 0.88, 0.75],
  x:         [0.60, 0.92, 0.95, 0.98, 1.00, 0.85, 0.62],
  facebook:  [0.75, 0.82, 0.88, 1.00, 0.95, 0.92, 0.78],
  tiktok:    [0.88, 0.78, 0.95, 0.85, 0.98, 1.00, 0.92],
};

// ---------------------------------------------------------------------------
// SEÑALES DE FORMATO — bonus/penalización por tipo de contenido
// ---------------------------------------------------------------------------
const FORMAT_SIGNALS = {
  instagram: { isBreaking:  0, hasVideo: +8, isAnalysis: -6, isEvergreen: +8 },
  x:         { isBreaking:+15, hasVideo: +3, isAnalysis: +5, isEvergreen: -5 },
  facebook:  { isBreaking: +3, hasVideo: +7, isAnalysis: +5, isEvergreen: +3 },
  tiktok:    { isBreaking:-15, hasVideo:+12, isAnalysis:-10, isEvergreen: +5 },
};

// Tiempo de producción por red (minutos)
const PRODUCTION_TIME = { instagram: 20, x: 2, facebook: 15, tiktok: 120 };

// Ventana de relevancia por tipo de caducidad (horas)
const DECAY_WINDOW = { INMEDIATA: 1, CORTA: 4, NORMAL: 12, EVERGREEN: 48 };

// ---------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// ---------------------------------------------------------------------------
function score(nota) {
  const now   = new Date();
  const hour  = now.getHours();
  const day   = now.getDay();
  const result = {};

  for (const net of ['instagram', 'x', 'facebook', 'tiktok']) {
    const content        = calcContentScore(nota, net);
    const moment         = calcMomentScore(net, hour, day);
    const viable         = isViable(nota.decayType, net);
    const urgency        = getUrgency(nota.decayType, net);
    const nextPeak       = getNextPeak(net, hour);
    const recommendation = getRecommendation(content, moment, viable, urgency, nextPeak);

    result[net] = { content, moment, viable, urgency, nextPeak, recommendation };
  }

  return result;
}

// ---------------------------------------------------------------------------
// SCORE DE CONTENIDO (0–100)
// Factores: categoría (50 pts) + trending (30 pts) + formato (20 pts)
// ---------------------------------------------------------------------------
function calcContentScore(nota, net) {
  const idx = ['instagram', 'x', 'facebook', 'tiktok'].indexOf(net);
  const weights = CATEGORY_WEIGHTS[nota.category] || CATEGORY_WEIGHTS.default;

  // Factor 1 — Categoría (50 pts máx)
  const categoryPts = weights[idx] * 0.50;

  // Factor 2 — Trending (30 pts)
  // Todas las notas vienen de un trend detectado → base 80%
  // Notas INMEDIATA/CORTA son más trending → bonus
  const trendBase  = 0.80;
  const trendBonus = nota.decayType === 'INMEDIATA' ? 0.20
                   : nota.decayType === 'CORTA'     ? 0.12
                   : 0;
  const trendingPts = 30 * Math.min(1, trendBase + trendBonus);

  // Factor 3 — Formato/contexto (20 pts máx)
  const signals = FORMAT_SIGNALS[net];
  let formatPts = 0;
  if (nota.isBreaking) formatPts += signals.isBreaking;
  if (nota.hasVideo)   formatPts += signals.hasVideo;
  if (nota.decayType === 'EVERGREEN') formatPts += signals.isEvergreen;
  formatPts = Math.max(-20, Math.min(20, formatPts));

  return Math.round(Math.min(100, Math.max(0, categoryPts + trendingPts + formatPts)));
}

// ---------------------------------------------------------------------------
// SCORE DE MOMENTO (0–100)
// Factores: hora (60 pts) + día (25 pts) + slot disponible (15 pts)
// ---------------------------------------------------------------------------
function calcMomentScore(net, hour, day) {
  const hourFactors = HOUR_FACTORS[net];
  const hourFactor  = hourFactors[hour] ?? getClosestHourFactor(hourFactors, hour);
  const dayMult     = DAY_MULTIPLIERS[net][day];

  const peakPts = Math.round(hourFactor * 60);
  const dayPts  = Math.round(dayMult * 25);
  const slotPts = 15; // asumimos parrilla libre hasta tener DB de calendar

  return Math.min(100, peakPts + dayPts + slotPts);
}

function getClosestHourFactor(hourFactors, hour) {
  const hours   = Object.keys(hourFactors).map(Number);
  const closest = hours.reduce((a, b) => Math.abs(b - hour) < Math.abs(a - hour) ? b : a);
  return hourFactors[closest] * 0.80; // penalizar por no ser el horario exacto
}

// ---------------------------------------------------------------------------
// PRÓXIMO PEAK
// ---------------------------------------------------------------------------
function getNextPeak(net, currentHour) {
  const peaks = Object.entries(HOUR_FACTORS[net])
    .sort((a, b) => b[1] - a[1])
    .map(([h]) => parseInt(h));

  const nextToday = peaks.find(h => h > currentHour);
  if (nextToday !== undefined) {
    return { hour: nextToday, label: `${String(nextToday).padStart(2, '0')}:00 hoy` };
  }
  return { hour: peaks[0], label: `${String(peaks[0]).padStart(2, '0')}:00 mañana` };
}

// ---------------------------------------------------------------------------
// VIABILIDAD — ¿hay tiempo de producir antes de que caduque?
// ---------------------------------------------------------------------------
function isViable(decayType, net) {
  const windowMinutes = DECAY_WINDOW[decayType] * 60;
  return PRODUCTION_TIME[net] < windowMinutes * 0.80;
}

// ---------------------------------------------------------------------------
// URGENCIA
// ---------------------------------------------------------------------------
function getUrgency(decayType, net) {
  if (decayType === 'INMEDIATA') return net === 'tiktok' ? 'NO_APLICA' : 'AHORA';
  if (decayType === 'CORTA')     return net === 'tiktok' ? 'NO_APLICA' : 'PROXIMO_PEAK';
  return 'MEJOR_PEAK';
}

// ---------------------------------------------------------------------------
// RECOMENDACIÓN FINAL
// Contenido → SI publicar | Momento → CUÁNDO publicar
// ---------------------------------------------------------------------------
function getRecommendation(content, moment, viable, urgency, nextPeak) {
  if (!viable || urgency === 'NO_APLICA') {
    return {
      action: 'NO_APLICA',
      label: 'No aplica',
      detail: 'El tiempo de producción supera la vida útil de la nota en esta red',
    };
  }

  if (content < 38) {
    return {
      action: 'NO_APLICA',
      label: 'No es su red',
      detail: 'Esta categoría de contenido no rinde en esta plataforma',
    };
  }

  if (urgency === 'AHORA') {
    return { action: 'AHORA', label: 'Publicar ahora', detail: 'Nota urgente — no esperes' };
  }

  if (content >= 60 && moment >= 70) {
    return { action: 'AHORA', label: 'Publicar ahora', detail: 'Buen contenido y momento ideal' };
  }

  if (content >= 60 && moment < 70) {
    return {
      action: 'PROGRAMAR',
      label: `Publicar a las ${nextPeak.label}`,
      detail: 'Espera el próximo peak para maximizar alcance',
    };
  }

  if (content >= 38 && moment >= 70) {
    return {
      action: 'CONSIDERAR',
      label: 'Considerar ahora',
      detail: 'El momento es bueno aunque el contenido encaja mejor en otra red',
    };
  }

  return {
    action: 'PROGRAMAR',
    label: `Publicar a las ${nextPeak.label}`,
    detail: 'Espera el próximo peak para maximizar el alcance',
  };
}

module.exports = { score };
