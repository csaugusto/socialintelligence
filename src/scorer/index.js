// Pesos por categoría: [instagram, x, facebook, tiktok]
const CATEGORY_WEIGHTS = {
  seguridad:       [85, 90, 90, 80],
  politica:        [55, 82, 65, 50],
  economia:        [50, 78, 58, 40],
  deportes:        [78, 86, 72, 84],
  entretenimiento: [88, 72, 78, 92],
  tecnologia:      [72, 80, 68, 70],
  salud:           [70, 68, 75, 72],
  cultura:         [65, 58, 68, 70],
  internacional:   [55, 78, 60, 50],
  default:         [32, 38, 34, 30],
};

// Peaks de audiencia por hora (factor 0.0–1.0)
const HOUR_FACTORS = {
  instagram: { 12: 1.00, 11: 0.95, 20: 0.85, 13: 0.80, 19: 0.78 },
  x:         { 15: 1.00, 18: 0.95, 21: 0.88, 12: 0.80, 17: 0.78 },
  facebook:  {  9: 1.00,  7: 0.95, 13: 0.92, 17: 0.85,  8: 0.82 },
  tiktok:    {  6: 1.00, 12: 0.95, 11: 0.90, 20: 0.85, 19: 0.82 },
};

// Multiplicador por día de semana (0=domingo, 6=sábado)
const DAY_MULTIPLIERS = {
  instagram: [0.70, 1.00, 0.95, 1.00, 0.90, 0.85, 0.72],
  x:         [0.58, 1.00, 1.00, 1.00, 0.90, 0.80, 0.60],
  facebook:  [0.78, 0.90, 0.95, 1.00, 0.92, 0.85, 0.80],
  tiktok:    [1.00, 0.82, 0.88, 0.90, 0.92, 1.00, 0.95],
};

// Tiempo de producción por red en minutos
const PRODUCTION_TIME = { instagram: 20, x: 2, facebook: 15, tiktok: 120 };

// Ventana de relevancia por decayType en horas
const DECAY_WINDOW = { INMEDIATA: 1, CORTA: 4, NORMAL: 12, EVERGREEN: 48 };

function score(nota) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const networks = ['instagram', 'x', 'facebook', 'tiktok'];
  const result = {};

  for (const net of networks) {
    const content = calcContentScore(nota, net);
    const moment = calcMomentScore(net, hour, day);
    const viable = isViable(nota.decayType, net);
    const urgency = getUrgency(nota.decayType, net);
    const nextPeak = getNextPeak(net, hour);
    const recommendation = getRecommendation(content, moment, viable, urgency, nextPeak);

    result[net] = { content, moment, viable, urgency, nextPeak, recommendation };
  }

  return result;
}

function calcContentScore(nota, net) {
  const idx = ['instagram', 'x', 'facebook', 'tiktok'].indexOf(net);
  const catWeights = CATEGORY_WEIGHTS[nota.category] || CATEGORY_WEIGHTS.default;

  // Factor 1: Categoría (50 pts máx)
  const categoryPts = catWeights[idx] * 0.50;

  // Factor 2: Trending (30 pts máx) — todas las notas vienen de un trend detectado
  // Damos 80% del máximo como base (nota fue seleccionada porque está trending)
  const trendingPts = 30 * 0.80;

  // Factor 3: Formato/Contexto (20 pts máx)
  let formatBonus = 0;
  if (nota.isBreaking) formatBonus += net === 'x' ? 15 : net === 'tiktok' ? -10 : net === 'instagram' ? 5 : 3;
  if (nota.hasVideo)   formatBonus += net === 'tiktok' ? 8 : net === 'instagram' ? 6 : net === 'facebook' ? 4 : 2;
  formatBonus = Math.max(-20, Math.min(20, formatBonus));

  const total = categoryPts + trendingPts + formatBonus;
  return Math.round(Math.min(100, Math.max(0, total)));
}

function calcMomentScore(net, hour, day) {
  const hourFactors = HOUR_FACTORS[net];
  const hourFactor = hourFactors[hour] ?? getClosestHourFactor(hourFactors, hour);
  const dayMultiplier = DAY_MULTIPLIERS[net][day];

  const peakScore = Math.round(hourFactor * 60);
  const dayScore = Math.round(dayMultiplier * 25);
  const slotScore = 15; // asumimos slot libre

  return Math.min(100, peakScore + dayScore + slotScore);
}

function getClosestHourFactor(hourFactors, hour) {
  const hours = Object.keys(hourFactors).map(Number);
  const closest = hours.reduce((a, b) => Math.abs(b - hour) < Math.abs(a - hour) ? b : a);
  return hourFactors[closest] * 0.85;
}

/**
 * Devuelve el próximo horario de peak para la red, después de la hora actual.
 * Si no hay peaks hoy, devuelve el mejor de mañana.
 */
function getNextPeak(net, currentHour) {
  const peaks = Object.entries(HOUR_FACTORS[net])
    .sort((a, b) => b[1] - a[1]) // ordenar por factor desc
    .map(([h]) => parseInt(h));

  // Buscar el siguiente peak que aún no pasó hoy
  const nextToday = peaks.find(h => h > currentHour);
  if (nextToday !== undefined) {
    return { hour: nextToday, label: `${String(nextToday).padStart(2, '0')}:00 hoy` };
  }

  // Si ya pasaron todos, el mejor peak es mañana
  return { hour: peaks[0], label: `${String(peaks[0]).padStart(2, '0')}:00 mañana` };
}

function isViable(decayType, net) {
  const windowHours = DECAY_WINDOW[decayType];
  const prodMinutes = PRODUCTION_TIME[net];
  return prodMinutes < windowHours * 60 * 0.80;
}

function getUrgency(decayType, net) {
  if (decayType === 'INMEDIATA') return net === 'tiktok' ? 'NO_APLICA' : 'AHORA';
  if (decayType === 'CORTA') return net === 'tiktok' ? 'NO_APLICA' : 'PROXIMO_PEAK';
  return 'MEJOR_PEAK';
}

/**
 * Lógica de recomendación:
 * - El contenido decide SI publicar en esta red
 * - El momento decide CUÁNDO publicar
 */
function getRecommendation(content, moment, viable, urgency, nextPeak) {
  if (!viable || urgency === 'NO_APLICA') {
    return { action: 'NO_APLICA', label: 'No aplica', detail: 'Tiempo de producción mayor a vida útil de la nota' };
  }

  if (content < 35) {
    return { action: 'NO_APLICA', label: 'No es su red', detail: 'Esta categoría no rinde bien en esta plataforma' };
  }

  if (urgency === 'AHORA') {
    return { action: 'AHORA', label: 'Publicar ahora', detail: 'Nota de urgencia inmediata' };
  }

  if (content >= 55 && moment >= 70) {
    return { action: 'AHORA', label: 'Publicar ahora', detail: 'Buen contenido y momento ideal' };
  }

  if (content >= 55 && moment < 70) {
    return { action: 'PROGRAMAR', label: `Publicar a las ${nextPeak.label}`, detail: 'Espera el próximo peak de audiencia' };
  }

  if (content >= 35 && moment >= 70) {
    return { action: 'CONSIDERAR', label: 'Considerar ahora', detail: 'El momento es bueno, el contenido podría rendir mejor en otra red' };
  }

  return { action: 'PROGRAMAR', label: `Publicar a las ${nextPeak.label}`, detail: 'Espera el próximo peak para maximizar alcance' };
}

module.exports = { score };
