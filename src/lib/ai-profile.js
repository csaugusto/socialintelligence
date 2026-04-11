/**
 * ai-profile.js — Perfil de IA por workspace
 *
 * Dos responsabilidades:
 *   1. buildUserProfile(workspace, wizardData) → compila el onboarding en un string
 *      estructurado que se guarda en workspaces.ai_profile
 *
 *   2. buildSystemPrompt(workspace, taskInstructions) → construye el system prompt
 *      completo para cualquier llamada de IA, prefijando el perfil del workspace
 */

// ---------------------------------------------------------------------------
// Mapeos legibles
// ---------------------------------------------------------------------------

const ACCOUNT_LABELS = {
  creator: 'Creador de contenido independiente',
  brand:   'Marca',
  company: 'Empresa / Corporativo',
  media:   'Medio de comunicación digital',
  agency:  'Agencia de contenido',
};

const FREQUENCY_LABELS = {
  diario:       'diario (todos los días)',
  '3-4x':       '3–4 veces por semana',
  '1-2x':       '1–2 veces por semana',
  semanal:      '1 pieza semanal elaborada',
  recomendado:  'según recomendación del sistema',
};

const CAPACITY_LABELS = {
  grabar_mucho:  'puede grabar mucho (tiene tiempo y setup)',
  poco_tiempo:   'tiene poco tiempo (prioriza ideas rápidas)',
  ideas_rapidas: 'prefiere ideas ligeras y rápidas de ejecutar',
  elaboradas:    'prioriza piezas elaboradas (calidad sobre cantidad)',
};

const TONE_LABELS = {
  profesional: 'profesional y formal',
  cercano:     'cercano y conversacional',
  directo:     'directo y sin rodeos',
  educativo:   'educativo y didáctico',
  inspirador:  'inspirador y motivacional',
  provocador:  'provocador y contracorriente',
  humoristico: 'humorístico y ligero',
  narrativo:   'narrativo con storytelling',
};

const CONTROVERSY_LABELS = {
  0: 'nula — evita cualquier polémica',
  1: 'mínima — solo temas seguros',
  2: 'moderada — opina sin polarizar',
  3: 'alta — dispuesto a generar debate',
};

const COMPETITOR_LABEL_LABELS = {
  competencia: 'competencia directa',
  inspiracion: 'inspiración',
  benchmark:   'benchmark de referencia',
  referente:   'referente aspiracional',
};

// ---------------------------------------------------------------------------

/**
 * Compila los datos del wizard de onboarding en un string estructurado.
 * Se guarda en workspaces.ai_profile y se usa como contexto permanente en IA.
 *
 * @param {{ name: string, type: string }} workspace
 * @param {import('../..').OnboardingData} wizardData
 * @returns {string}
 */
function buildUserProfile(workspace, wizardData) {
  const lines = [];

  const accountLabel = ACCOUNT_LABELS[workspace.type] || workspace.type;
  lines.push(`Tipo de cuenta: ${accountLabel}.`);

  // Objetivos
  if (wizardData.objectives?.length) {
    lines.push(`Objetivos principales: ${wizardData.objectives.join(', ')}.`);
  }

  // Plataformas
  if (wizardData.platforms?.length) {
    lines.push(`Plataformas activas: ${wizardData.platforms.join(', ')}.`);
  }

  // Nicho + campo libre
  const nicho = wizardData.nicho || [];
  const nichoList = wizardData.customNicho
    ? [...nicho, wizardData.customNicho]
    : nicho;
  if (nichoList.length) {
    lines.push(`Nicho y temas: ${nichoList.join(', ')}.`);
  }

  // Pilares
  if (wizardData.pillars?.length) {
    lines.push(`Pilares de contenido: ${wizardData.pillars.join(', ')}.`);
  }

  // Competidores
  if (wizardData.competitors?.length) {
    const refs = wizardData.competitors.map(c => {
      const name = c.display_name || c.handle;
      const labelStr = COMPETITOR_LABEL_LABELS[c.label] || c.label;
      return `${name} (${c.platform}, ${labelStr})`;
    });
    lines.push(`Cuentas monitoreadas: ${refs.join('; ')}.`);
  }

  // Ritmo
  if (wizardData.frequency) {
    const freqLabel = FREQUENCY_LABELS[wizardData.frequency] || wizardData.frequency;
    lines.push(`Ritmo de publicación: ${freqLabel}.`);
  }
  if (wizardData.productionCapacity) {
    const capLabel = CAPACITY_LABELS[wizardData.productionCapacity] || wizardData.productionCapacity;
    lines.push(`Capacidad de producción: ${capLabel}.`);
  }

  // Tono
  if (wizardData.tone) {
    const toneLabel = TONE_LABELS[wizardData.tone] || wizardData.tone;
    lines.push(`Tono de comunicación: ${toneLabel}.`);
  }

  const clevel = wizardData.controversyLevel ?? 1;
  const contrLabel = CONTROVERSY_LABELS[clevel] ?? `nivel ${clevel}`;
  lines.push(`Controversia: ${contrLabel}.`);

  if (wizardData.toneAvoid?.length) {
    lines.push(`Evitar siempre: ${wizardData.toneAvoid.join(', ')}.`);
  }

  // Patrones de contenido (del análisis de canal)
  const cp = wizardData.contentPatterns;
  if (cp) {
    lines.push('');
    lines.push('## Historial de contenido analizado');
    if (cp.top_topics?.length)         lines.push(`Temas que más le funcionan: ${cp.top_topics.join(', ')}.`);
    if (cp.content_pillars?.length)    lines.push(`Pilares detectados: ${cp.content_pillars.join(', ')}.`);
    if (cp.top_formats?.length)        lines.push(`Formatos ganadores: ${cp.top_formats.join(', ')}.`);
    if (cp.tone)                       lines.push(`Tono real del canal: ${cp.tone}.`);
    if (cp.what_works)                 lines.push(`Qué funciona: ${cp.what_works}`);
    if (cp.what_doesnt)                lines.push(`Qué no funciona: ${cp.what_doesnt}`);
    if (cp.avoid?.length)              lines.push(`Evitar en contenido: ${cp.avoid.join(', ')}.`);
    if (cp.recommended_duration)       lines.push(`Duración ideal de video: ${cp.recommended_duration}.`);
    if (cp.best_platform)              lines.push(`Mejor plataforma según historial: ${cp.best_platform}.`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------

/**
 * Construye el system prompt completo para una llamada de IA.
 * Si el workspace aún no tiene ai_profile (onboarding pendiente), solo retorna
 * las instrucciones de la tarea sin contexto de cuenta.
 *
 * @param {{ name: string, ai_profile?: string }} workspace
 * @param {string} taskInstructions - instrucciones específicas del endpoint que llama
 * @returns {string}
 */
function buildSystemPrompt(workspace, taskInstructions) {
  if (!workspace?.ai_profile) {
    return taskInstructions;
  }

  return `Eres el copiloto de contenido de "${workspace.name}".

Contexto estratégico del workspace — úsalo como referencia permanente para adaptar tono, temas, ángulo y formato en cada respuesta:

${workspace.ai_profile}

---

${taskInstructions}`.trim();
}

// ---------------------------------------------------------------------------

module.exports = { buildUserProfile, buildSystemPrompt };
