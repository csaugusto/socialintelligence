/**
 * Scorer v2 — subscores transparentes + juicio contextual con Groq
 *
 * Tres capas:
 *   1. Subscores visibles con etiquetas (sin caja negra)
 *   2. trendContext enriquecido (fuentes, crossSource)
 *   3. Groq judgment — razonamiento editorial final
 *
 * Output por red mantiene compatibilidad con v1:
 *   { content, moment, viable, urgency, nextPeak, recommendation }
 *
 * Campos nuevos (aditivos):
 *   { subscores, recommendation.reasoning, _judgment }
 */

const Groq = require('groq-sdk');

let groqClient = null;
function getGroqClient() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// ---------------------------------------------------------------------------
// CONSTANTES
// ---------------------------------------------------------------------------

const NETWORKS = ['instagram', 'x', 'facebook', 'tiktok'];

const NET_NAMES = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

const CAT_NAMES = {
  politica: 'Política',
  economia: 'Economía',
  seguridad: 'Seguridad',
  deportes: 'Deportes',
  entretenimiento: 'Entretenimiento',
  tecnologia: 'Tecnología',
  salud: 'Salud',
  cultura: 'Cultura',
  internacional: 'Internacional',
  default: 'General',
};

// PESOS POR CATEGORÍA [instagram, x, facebook, tiktok]
const CATEGORY_WEIGHTS = {
  //              IG    X    FB   TK
  seguridad:    [ 70,  92,  88,  42],
  politica:     [ 48,  90,  72,  38],
  economia:     [ 42,  85,  62,  28],
  deportes:     [ 84,  88,  72,  88],
  entretenimiento: [90, 65, 74, 95],
  tecnologia:   [ 76,  84,  64,  72],
  salud:        [ 74,  62,  85,  70],
  cultura:      [ 85,  55,  68,  80],
  internacional:[ 50,  84,  60,  42],
  default:      [ 50,  55,  52,  45],
};

// PEAKS DE AUDIENCIA POR HORA (factor 0.0–1.0) — Sprout Social 2024 + ajuste LATAM GMT-6
const HOUR_FACTORS = {
  instagram: { 11: 1.00, 12: 0.98, 10: 0.88, 14: 0.85, 19: 0.90, 20: 0.88, 13: 0.80 },
  x:         {  9: 1.00, 12: 0.92, 13: 0.90, 17: 0.88, 18: 0.85,  8: 0.82, 20: 0.78 },
  facebook:  {  9: 1.00, 10: 0.95, 13: 0.90, 14: 0.88, 15: 0.85, 19: 0.80,  8: 0.78 },
  tiktok:    { 20: 1.00, 19: 0.97, 21: 0.95, 12: 0.88, 13: 0.85,  7: 0.80, 22: 0.78 },
};

// MULTIPLICADOR POR DÍA (0=dom … 6=sáb)
const DAY_MULTIPLIERS = {
  //          dom   lun   mar   mié   jue   vie   sáb
  instagram: [0.72, 0.85, 1.00, 0.98, 0.95, 0.88, 0.75],
  x:         [0.60, 0.92, 0.95, 0.98, 1.00, 0.85, 0.62],
  facebook:  [0.75, 0.82, 0.88, 1.00, 0.95, 0.92, 0.78],
  tiktok:    [0.88, 0.78, 0.95, 0.85, 0.98, 1.00, 0.92],
};

// SEÑALES DE FORMATO — bonus/penalización
const FORMAT_SIGNALS = {
  instagram: { isBreaking:  0, hasVideo: +8, isAnalysis: -6, isEvergreen: +8 },
  x:         { isBreaking:+15, hasVideo: +3, isAnalysis: +5, isEvergreen: -5 },
  facebook:  { isBreaking: +3, hasVideo: +7, isAnalysis: +5, isEvergreen: +3 },
  tiktok:    { isBreaking:-15, hasVideo:+12, isAnalysis:-10, isEvergreen: +5 },
};

const PRODUCTION_TIME = { instagram: 20, x: 2, facebook: 15, tiktok: 120 };
const DECAY_WINDOW    = { INMEDIATA: 1, CORTA: 4, NORMAL: 12, EVERGREEN: 48 };

// ---------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL (async por Groq)
// ---------------------------------------------------------------------------

/**
 * Fusiona overrides parciales de category_weights con los defaults del scorer.
 * Solo se reemplazan las categorías presentes en overrides; el resto usa defaults.
 *
 * @param {object} overrides — objeto parcial { categoria: [ig, x, fb, tk], ... }
 * @returns {object} pesos fusionados completos
 */
function mergeWeights(overrides) {
  return { ...CATEGORY_WEIGHTS, ...overrides };
}

async function score(nota, trendContext = {}, clientConfig = {}) {
  const now  = new Date();
  const hour = now.getHours();
  const day  = now.getDay();
  const result = {};

  // Fusionar clientConfig con las constantes por defecto
  const WEIGHTS    = clientConfig.category_weights  ? mergeWeights(clientConfig.category_weights)  : CATEGORY_WEIGHTS;
  const HOUR_F     = clientConfig.hour_factors       ? clientConfig.hour_factors                    : HOUR_FACTORS;
  const DAY_M      = clientConfig.day_multipliers    ? clientConfig.day_multipliers                 : DAY_MULTIPLIERS;
  const FORMAT_SIG = clientConfig.format_signals     ? clientConfig.format_signals                  : FORMAT_SIGNALS;
  const PROD_TIME  = clientConfig.production_time    ? clientConfig.production_time                 : PRODUCTION_TIME;
  const NETS       = clientConfig.enabled_networks   ? clientConfig.enabled_networks                : NETWORKS;

  for (const net of NETS) {
    const contentData    = calcContentScore(nota, net, trendContext, WEIGHTS, FORMAT_SIG);
    const momentData     = calcMomentScore(net, hour, day, now, HOUR_F, DAY_M, PROD_TIME);
    const viable         = isViable(nota.decayType, net, PROD_TIME);
    const urgency        = getUrgency(nota.decayType, net);
    const nextPeak       = getNextPeak(net, hour, HOUR_F);
    const recommendation = getRecommendation(contentData.total, momentData.total, viable, urgency, nextPeak);

    result[net] = {
      // Backward compat (dashboard no cambia)
      content: contentData.total,
      moment:  momentData.total,
      viable,
      urgency,
      nextPeak,
      recommendation,
      // Nuevo: subscores con etiquetas
      subscores: {
        ...contentData.subscores,
        ...momentData.subscores,
      },
    };
  }

  // Fase 3: Groq judgment — razonamiento editorial sobre todo el contexto
  const judgment = await groqJudgment(nota, trendContext, result, clientConfig);
  if (judgment) {
    result._judgment = judgment;
    if (judgment.reasoning) {
      for (const net of NETS) {
        result[net].recommendation.reasoning = judgment.reasoning;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// SCORE DE CONTENIDO — retorna total + subscores
// ---------------------------------------------------------------------------

function calcContentScore(nota, net, trendContext, WEIGHTS, FORMAT_SIG) {
  const idx     = NETWORKS.indexOf(net);
  const weights = WEIGHTS[nota.category] || WEIGHTS.default;

  // Subscore 1: Platform Fit (aporta hasta 50 pts al total)
  const platformFitRaw = weights[idx]; // 0–100
  const platformFitPts = platformFitRaw * 0.50;

  // Subscore 2: Trend Strength (aporta hasta 30 pts)
  const trendBase    = 0.80;
  const trendBonus   = nota.decayType === 'INMEDIATA' ? 0.20
                     : nota.decayType === 'CORTA'     ? 0.12
                     : 0;
  const crossBonus   = trendContext.crossSource ? 0.05 : 0;
  const trendStrength = Math.min(1, trendBase + trendBonus + crossBonus);
  const trendPts     = 30 * trendStrength;

  // Subscore 3: Content Readiness (aporta -20 a +20 pts)
  const signals = FORMAT_SIG[net];
  let readinessPts = 0;
  if (nota.isBreaking)                  readinessPts += signals.isBreaking;
  if (nota.hasVideo)                    readinessPts += signals.hasVideo;
  if (nota.decayType === 'EVERGREEN')   readinessPts += signals.isEvergreen;
  readinessPts = Math.max(-20, Math.min(20, readinessPts));

  const total = Math.round(Math.min(100, Math.max(0, platformFitPts + trendPts + readinessPts)));

  return {
    total,
    subscores: {
      platformFit: {
        score: platformFitRaw,
        label: platformFitLabel(net, nota.category, platformFitRaw),
      },
      trend: {
        score: Math.round(trendStrength * 100),
        label: trendLabel(nota.decayType, trendContext),
      },
      contentReadiness: {
        score: Math.round(((readinessPts + 20) / 40) * 100),
        label: contentReadinessLabel(net, nota, readinessPts),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// SCORE DE MOMENTO — retorna total + subscores
// ---------------------------------------------------------------------------

function calcMomentScore(net, hour, day, now, HOUR_F, DAY_M, PROD_TIME) {
  const hourFactors = HOUR_F[net];
  const hourFactor  = hourFactors[hour] ?? getClosestHourFactor(hourFactors, hour);
  const dayMult     = DAY_M[net][day];

  const peakPts = Math.round(hourFactor * 60);
  const dayPts  = Math.round(dayMult * 25);

  let slotPts   = 15;
  let slotCount = 0;
  try {
    const { getSlotCount } = require('../db');
    slotCount = getSlotCount(net, now.toISOString());
    if (slotCount === 1)  slotPts = 10;
    else if (slotCount === 2) slotPts = 5;
    else if (slotCount >= 3)  slotPts = 0;
  } catch { /* slot libre si falla */ }

  const total = Math.min(100, peakPts + dayPts + slotPts);

  return {
    total,
    subscores: {
      timing: {
        score:     Math.round(hourFactor * 100),
        dayFactor: Math.round(dayMult * 100),
        label:     timingLabel(net, hourFactor, dayMult),
      },
      saturation: {
        score:     Math.round((slotPts / 15) * 100),
        slotCount,
        label:     saturationLabel(slotCount),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// HELPERS DE MOMENTO
// ---------------------------------------------------------------------------

function getClosestHourFactor(hourFactors, hour) {
  const hours   = Object.keys(hourFactors).map(Number);
  const closest = hours.reduce((a, b) => Math.abs(b - hour) < Math.abs(a - hour) ? b : a);
  return hourFactors[closest] * 0.80;
}

function getNextPeak(net, currentHour, hourFactorsMap = HOUR_FACTORS) {
  const peaks = Object.entries(hourFactorsMap[net] || HOUR_FACTORS[net])
    .sort((a, b) => b[1] - a[1])
    .map(([h]) => parseInt(h));
  const nextToday = peaks.find(h => h > currentHour);
  if (nextToday !== undefined) {
    return { hour: nextToday, label: `${String(nextToday).padStart(2, '0')}:00 hoy` };
  }
  return { hour: peaks[0], label: `${String(peaks[0]).padStart(2, '0')}:00 mañana` };
}

function isViable(decayType, net, PROD_TIME) {
  const windowMinutes = DECAY_WINDOW[decayType] * 60;
  return PROD_TIME[net] < windowMinutes * 0.80;
}

function getUrgency(decayType, net) {
  if (decayType === 'INMEDIATA') return net === 'tiktok' ? 'NO_APLICA' : 'AHORA';
  if (decayType === 'CORTA')     return net === 'tiktok' ? 'NO_APLICA' : 'PROXIMO_PEAK';
  return 'MEJOR_PEAK';
}

// ---------------------------------------------------------------------------
// RECOMENDACIÓN FINAL (lógica v1 preservada)
// ---------------------------------------------------------------------------

function getRecommendation(content, moment, viable, urgency, nextPeak) {
  if (!viable || urgency === 'NO_APLICA') {
    return {
      action: 'NO_APLICA',
      label:  'No aplica',
      detail: 'El tiempo de producción supera la vida útil de la nota en esta red',
      reasoning: null,
    };
  }

  if (content < 38) {
    return {
      action: 'NO_APLICA',
      label:  'No es su red',
      detail: 'Esta categoría de contenido no rinde en esta plataforma',
      reasoning: null,
    };
  }

  if (urgency === 'AHORA') {
    return {
      action: 'AHORA',
      label:  'Sí, se sugiere publicar',
      detail: 'Nota urgente — no esperes',
      reasoning: null,
    };
  }

  if (content >= 60 && moment >= 70) {
    return {
      action: 'AHORA',
      label:  'Sí, se sugiere publicar',
      detail: 'Buen contenido y momento ideal',
      reasoning: null,
    };
  }

  if (content >= 60 && moment < 70) {
    return {
      action: 'PROGRAMAR',
      label:  `Publicar a las ${nextPeak.label}`,
      detail: 'Espera el próximo peak para maximizar alcance',
      reasoning: null,
    };
  }

  if (content >= 38 && moment >= 70) {
    return {
      action: 'CONSIDERAR',
      label:  'Considerar',
      detail: 'El momento es bueno aunque el contenido encaja mejor en otra red',
      reasoning: null,
    };
  }

  return {
    action: 'PROGRAMAR',
    label:  `Publicar a las ${nextPeak.label}`,
    detail: 'Espera el próximo peak para maximizar el alcance',
    reasoning: null,
  };
}

// ---------------------------------------------------------------------------
// GROQ JUDGMENT — razonamiento editorial con contexto completo
// ---------------------------------------------------------------------------

async function groqJudgment(nota, trendContext, networkResults, clientConfig = {}) {
  const client = getGroqClient();
  if (!client) return null;

  // Usa las redes activas del cliente si están definidas, si no todas las del scorer
  const NETS = clientConfig.enabled_networks || NETWORKS;

  const networksInfo = NETS.map(net => {
    const r = networkResults[net];
    return `- ${NET_NAMES[net]}: contenido=${r.content}, momento=${r.moment}, acción=${r.recommendation.action}`;
  }).join('\n');

  const now    = new Date();
  const hora   = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const dia    = now.toLocaleDateString('es-MX', { weekday: 'long' });
  const sources = (trendContext.sources || [trendContext.source]).filter(Boolean).join(' + ') || 'fuente desconocida';
  const catName = CAT_NAMES[nota.category] || nota.category;

  const prompt = `Eres editor digital de un medio mexicano. Analiza esta nota y emite un juicio editorial breve.

NOTA: "${nota.title}"
Categoría: ${catName} | Caducidad: ${nota.decayType} | Breaking: ${nota.isBreaking ? 'Sí' : 'No'}
Trend origen: "${nota.sourceTrend}" — detectado en: ${sources}${trendContext.crossSource ? ' (múltiples fuentes simultáneas)' : ''}

HORA: ${hora}, ${dia}

SCORES POR RED:
${networksInfo}

Responde ÚNICAMENTE con JSON válido:
{
  "notify": true o false,
  "priority": "alta|media|baja",
  "reasoning": "1-2 oraciones: por qué publicar o no y en qué redes priorizar",
  "topNetworks": ["red1", "red2"],
  "flags": []
}`;

  // System prompt personalizado por cliente si hay narrativa, si no genérico
  const systemPrompt = clientConfig?.profile_narrative
    || 'Editor digital. Responde ÚNICAMENTE con JSON válido.';

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 250,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt },
      ],
    });
    return JSON.parse(completion.choices[0]?.message?.content);
  } catch (err) {
    console.warn('[Scorer] Groq judgment falló:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// GENERADORES DE ETIQUETAS
// ---------------------------------------------------------------------------

function platformFitLabel(net, category, score) {
  const netName = NET_NAMES[net];
  const catName = CAT_NAMES[category] || 'Esta categoría';
  if (score >= 85) return `${catName} es ideal para ${netName}`;
  if (score >= 70) return `${catName} encaja bien en ${netName}`;
  if (score >= 50) return `${catName} tiene alcance moderado en ${netName}`;
  return `${catName} no es el fuerte de ${netName}`;
}

function trendLabel(decayType, trendContext) {
  const multi = trendContext?.crossSource;
  if (decayType === 'INMEDIATA' && multi) return 'Tendencia en múltiples fuentes — ventana de publicación muy corta';
  if (decayType === 'INMEDIATA')          return 'Tendencia inmediata — ventana de publicación muy corta';
  if (decayType === 'CORTA'     && multi) return 'Confirmado en múltiples fuentes, actuar pronto';
  if (decayType === 'CORTA')              return 'Tendencia activa, relevancia decae rápido';
  if (decayType === 'EVERGREEN')          return 'Contenido perenne, sin urgencia temporal';
  return multi ? 'Tendencia confirmada en varias fuentes' : 'Tendencia de duración normal';
}

function contentReadinessLabel(net, nota, pts) {
  if (net === 'tiktok') {
    if (nota.hasVideo)   return 'Video disponible, formato nativo de TikTok';
    if (nota.isBreaking) return 'Breaking no encaja en TikTok — audiencia busca entretenimiento';
    return 'Sin video — TikTok penaliza el contenido sin visual';
  }
  if (net === 'x') {
    if (nota.isBreaking)                return 'Breaking: X es la red ideal para noticias de última hora';
    if (nota.hasVideo)                  return 'Video refuerza el alcance en X';
    if (nota.decayType === 'EVERGREEN') return 'Evergreen no prioriza en X — preferida para noticias frescas';
  }
  if (net === 'instagram') {
    if (nota.hasVideo)                  return 'Video disponible, potencial para Reel';
    if (nota.decayType === 'EVERGREEN') return 'Evergreen ideal para carrusel o post permanente';
    if (nota.isBreaking)                return 'Breaking encaja en Stories de Instagram';
  }
  if (net === 'facebook') {
    if (nota.hasVideo)                  return 'Video aumenta el alcance orgánico en Facebook';
    if (nota.decayType === 'EVERGREEN') return 'Evergreen funciona bien como álbum o post largo';
    if (nota.isBreaking)                return 'Breaking suma alcance en Facebook vía compartidos';
  }
  if (pts > 5)  return 'Formato con buen potencial para esta red';
  if (pts < -5) return 'Formato con fricción para esta red';
  return 'Formato estándar para esta red';
}

function timingLabel(net, hourFactor, dayMult) {
  const netName = NET_NAMES[net];
  let timeStr;
  if (hourFactor >= 0.90)      timeStr = `Horario pico para ${netName}`;
  else if (hourFactor >= 0.75) timeStr = `Buen horario para ${netName}`;
  else if (hourFactor >= 0.60) timeStr = `Horario aceptable para ${netName}`;
  else                         timeStr = `Fuera del horario ideal de ${netName}`;

  if (dayMult >= 0.95) return `${timeStr}, mejor día de la semana`;
  if (dayMult >= 0.85) return `${timeStr}, buen día`;
  if (dayMult < 0.75)  return `${timeStr}, día de bajo tráfico`;
  return timeStr;
}

function saturationLabel(slotCount) {
  if (slotCount === 0)  return 'Slot libre, sin competencia';
  if (slotCount === 1)  return 'Un post ya programado en este horario';
  if (slotCount === 2)  return 'Dos posts en este horario, alcance reducido';
  return 'Slot saturado — considera otro horario';
}

module.exports = { score };
