/**
 * Cruza tendencias detectadas con el perfil y historial del creator.
 * Usa IA para evaluar cuáles tendencias puede cubrir de manera auténtica
 * y con ventaja diferencial, basándose en lo que ya le ha funcionado.
 */

const Groq = require('groq-sdk');

let client = null;
function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

const NICHO_LABELS = {
  lifestyle: 'Lifestyle', tecnologia: 'Tecnología', entretenimiento: 'Entretenimiento',
  educacion: 'Educación', fitness: 'Fitness / Salud', finanzas: 'Finanzas',
  gaming: 'Gaming', moda: 'Moda / Belleza', gastronomia: 'Gastronomía',
  viajes: 'Viajes', negocios: 'Negocios / Emprendimiento', otro: 'Otro',
};

const MIN_FIT_SCORE = 55;

/**
 * @param {object[]} trends  - Tendencias crudas del aggregator
 * @param {object}   profile - Perfil del creator con content_patterns opcionales
 * @returns {object[]} Tendencias filtradas y enriquecidas con fit_score, fit_reason, angle_hint
 */
async function match(trends, profile) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[Matcher] GROQ_API_KEY no configurada — devolviendo trends sin filtrar.');
    return trends;
  }

  if (!trends?.length) return [];

  const hasPatterns = !!(profile?.content_patterns?.top_topics?.length);
  const prompt = hasPatterns
    ? buildPromptWithHistory(trends, profile)
    : buildPromptNichoOnly(trends, profile);

  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(hasPatterns) },
        { role: 'user', content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.matches)) {
      console.warn('[Matcher] Respuesta inesperada:', raw?.slice(0, 200));
      return trends;
    }

    // Construir mapa de tendencias originales para merge
    const trendMap = Object.fromEntries(trends.map(t => [normalize(t.keyword), t]));

    const enriched = parsed.matches
      .filter(m => (m.fit_score || 0) >= MIN_FIT_SCORE)
      .sort((a, b) => b.fit_score - a.fit_score)
      .slice(0, 8)
      .map(m => {
        const original = trendMap[normalize(m.keyword)] || trends.find(t =>
          normalize(t.keyword).includes(normalize(m.keyword)) ||
          normalize(m.keyword).includes(normalize(t.keyword))
        ) || {};
        return {
          ...original,
          keyword: m.keyword || original.keyword,
          fit_score: m.fit_score,
          fit_reason: m.fit_reason,
          angle_hint: m.angle_hint,
        };
      });

    console.log(`[Matcher] ${trends.length} tendencias → ${enriched.length} relevantes para este creator`);
    return enriched;

  } catch (err) {
    console.error('[Matcher] Error:', err.message);
    return trends; // fallback: devolver sin filtrar
  }
}

function normalize(str = '') {
  return str.toLowerCase().trim().replace(/[^a-záéíóúüñ0-9\s]/g, '').replace(/\s+/g, ' ');
}

function buildSystemPrompt(hasPatterns) {
  if (hasPatterns) {
    return `Eres el estratega personal de contenido de este creator. Conoces profundamente su historia: qué temas le resuenan a su audiencia, qué formatos ha probado, cuál es su voz. Tu trabajo es identificar cuáles tendencias actuales puede cubrir de manera auténtica — no forzada — y con ventaja diferencial frente a otros creators en su nicho. Respondes ÚNICAMENTE con JSON válido.`;
  }
  return `Eres un estratega de contenido digital especializado en creators mexicanos. Tu trabajo es evaluar cuáles tendencias son relevantes para el nicho de un creator, identificando conexiones naturales y ángulos creativos viables. Respondes ÚNICAMENTE con JSON válido.`;
}

function buildPromptWithHistory(trends, profile) {
  const p = profile.content_patterns;
  const nichoLabel = NICHO_LABELS[profile.main_category] || profile.main_category || 'General';
  const secondaryNichos = (profile.categories || [])
    .filter(c => c !== profile.main_category)
    .map(c => NICHO_LABELS[c] || c);

  const trendsStr = trends.map((t, i) => {
    const source = t.source === 'youtube_trending' ? 'YouTube MX'
      : t.source === 'reddit' ? `Reddit r/${t.subreddit || 'popular'}`
      : 'Google Trends MX';
    return `${i + 1}. [${source}] "${t.keyword}"${t.excerpt ? `\n   → ${t.excerpt}` : ''}`;
  }).join('\n\n');

  return `# CREATOR DNA

**Nicho principal:** ${nichoLabel}${secondaryNichos.length ? `  |  Secundarios: ${secondaryNichos.join(', ')}` : ''}
**Red principal:** ${profile.primary_network || 'instagram'}
**Redes activas:** ${(profile.active_networks || []).join(', ')}
${profile.audience_age_range ? `**Audiencia:** ${profile.audience_age_range} años` : ''}
**Produce video:** ${profile.produces_video ? 'sí' : 'no'}

## Lo que le funciona en su canal
- **Temas ganadores:** ${(p.top_topics || []).join(', ')}
- **Pilares de contenido:** ${(p.content_pillars || []).join(', ')}
- **Formatos que resuenan:** ${(p.top_formats || []).join(', ')}
- **Su tono y voz:** ${p.tone || 'no definido'}
- **Patrón de engagement:** ${p.what_works || 'no analizado'}
- **Duración ideal:** ${p.recommended_duration || 'no definida'}

## Lo que NO le funciona
- **Patrón de bajo rendimiento:** ${p.what_doesnt || 'no identificado'}
- **Evitar:** ${(p.avoid || []).join(', ') || 'nada específico'}

---

# TENDENCIAS DETECTADAS HOY (${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })})

${trendsStr}

---

# INSTRUCCIÓN

Evalúa cada tendencia considerando:
1. **Autenticidad:** ¿Conecta con los temas que ya ha demostrado dominar?
2. **Ángulo diferencial:** ¿Hay un ángulo específico que aproveche su voz y estilo?
3. **Viabilidad:** ¿Lo puede producir con sus recursos actuales?
4. **Resonancia de audiencia:** ¿Su audiencia específica le va a responder?

Devuelve ÚNICAMENTE este JSON:

{
  "matches": [
    {
      "keyword": "keyword exacto tal como aparece arriba",
      "fit_score": 85,
      "fit_reason": "una oración específica que mencione algo concreto de su historial: por qué esta tendencia conecta con lo que ya hace",
      "angle_hint": "el ángulo más natural para este creator — cómo enfocaría este tema desde su voz y estilo, en 1 oración"
    }
  ]
}

REGLAS:
- Solo incluye tendencias con fit_score >= 55
- fit_reason DEBE mencionar algo específico de su historial (un tema top, un pilar, su tono, su audiencia)
- NO incluyas tendencias que le queden forzadas aunque el nicho sea cercano
- Máximo 8 resultados, ordenados por fit_score descendente
- Escribe en español mexicano natural`;
}

function buildPromptNichoOnly(trends, profile) {
  const nichoLabel = NICHO_LABELS[profile.main_category] || profile.main_category || 'General';
  const secondaryNichos = (profile.categories || [])
    .filter(c => c !== profile.main_category)
    .map(c => NICHO_LABELS[c] || c);

  const trendsStr = trends.map((t, i) => {
    const source = t.source === 'youtube_trending' ? 'YouTube MX'
      : t.source === 'reddit' ? `Reddit r/${t.subreddit || 'popular'}`
      : 'Google Trends MX';
    return `${i + 1}. [${source}] "${t.keyword}"${t.excerpt ? `\n   → ${t.excerpt}` : ''}`;
  }).join('\n\n');

  return `# PERFIL DEL CREATOR

**Nicho principal:** ${nichoLabel}${secondaryNichos.length ? `  |  Secundarios: ${secondaryNichos.join(', ')}` : ''}
**Red principal:** ${profile.primary_network || 'instagram'}
**Audiencia:** ${profile.audience_age_range || 'no especificada'} años
**Produce video:** ${profile.produces_video ? 'sí' : 'no'}

*Nota: Este creator aún no ha analizado su historial de contenido. Evalúa solo con base en su nicho.*

---

# TENDENCIAS DETECTADAS HOY (${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })})

${trendsStr}

---

# INSTRUCCIÓN

Evalúa cuáles de estas tendencias son relevantes para un creator de "${nichoLabel}". Busca conexiones naturales y ángulos viables — no fuerces temas que no aplican.

Devuelve ÚNICAMENTE este JSON:

{
  "matches": [
    {
      "keyword": "keyword exacto tal como aparece arriba",
      "fit_score": 75,
      "fit_reason": "por qué esta tendencia es relevante para el nicho ${nichoLabel} y su audiencia",
      "angle_hint": "cómo un creator de ${nichoLabel} podría abordar este tema de manera auténtica, en 1 oración"
    }
  ]
}

REGLAS:
- Solo incluye tendencias con fit_score >= 55
- Máximo 8 resultados, ordenados por fit_score descendente
- Escribe en español mexicano natural`;
}

module.exports = { match };
