/**
 * Analiza el historial de contenido publicado de un creator
 * y extrae patrones accionables para el generador de briefs.
 *
 * Input:  array de { platform, posts[] } de uno o varios connectors
 * Output: content_patterns (se guarda en client_profiles)
 */

const Groq = require('groq-sdk');

let client = null;
function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

/**
 * @param {object[]} accountsData  - [{ platform, posts[] }, ...]
 * @param {object}   profile       - Perfil del creator
 * @returns {object} content_patterns
 */
async function analyze(accountsData, profile) {
  const allPosts = accountsData.flatMap(a =>
    a.posts.map(p => ({ ...p, platform: a.platform }))
  );

  if (!allPosts.length) {
    console.warn('[Analyzer] Sin posts para analizar.');
    return null;
  }

  // Top posts por engagement (views + likes*3 + comments*5)
  const scored = allPosts
    .map(p => ({ ...p, engagementScore: (p.views || 0) + (p.likes || 0) * 3 + (p.comments || 0) * 5 }))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  const topPosts    = scored.slice(0, 10);
  const bottomPosts = scored.slice(-5);

  console.log(`[Analyzer] Analizando ${allPosts.length} posts (top ${topPosts.length} seleccionados)`);

  const patterns = await groqAnalysis(topPosts, bottomPosts, profile);
  return {
    ...patterns,
    analyzed_at:  new Date().toISOString(),
    total_posts:  allPosts.length,
    platforms:    [...new Set(allPosts.map(p => p.platform))],
  };
}

async function groqAnalysis(topPosts, bottomPosts, profile) {
  const nichoLabel = profile.main_category || 'general';

  const topStr = topPosts.map((p, i) =>
    `${i + 1}. [${p.platform}] "${p.title}" — ${p.views?.toLocaleString() || 0} views, ${p.likes?.toLocaleString() || 0} likes | Formato: ${p.format || 'unknown'}`
  ).join('\n');

  const bottomStr = bottomPosts.map((p, i) =>
    `${i + 1}. [${p.platform}] "${p.title}" — ${p.views?.toLocaleString() || 0} views | Formato: ${p.format || 'unknown'}`
  ).join('\n');

  const prompt = `Eres un estratega de contenido digital. Analiza el historial de un creator de "${nichoLabel}" y extrae patrones accionables.

TOP CONTENIDO (mayor engagement):
${topStr}

CONTENIDO CON MENOR RENDIMIENTO:
${bottomStr}

Devuelve ÚNICAMENTE este JSON:
{
  "top_topics": ["tema1", "tema2", "tema3"],
  "top_formats": ["formato1", "formato2"],
  "hook_patterns": ["patrón de apertura 1", "patrón de apertura 2"],
  "tone": "descripción del tono y voz del creator en 1 oración",
  "what_works": "qué tienen en común los posts con más engagement, en 2 oraciones",
  "what_doesnt": "qué tienen en común los posts con menor rendimiento, en 1 oración",
  "content_pillars": ["pilar 1", "pilar 2", "pilar 3"],
  "avoid": ["cosa a evitar 1", "cosa a evitar 2"],
  "best_platform": "la plataforma donde tiene mejor rendimiento",
  "recommended_duration": "duración ideal de video según su historial, ej: 30-45 segundos"
}`;

  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Estratega de contenido digital. Responde ÚNICAMENTE con JSON válido.' },
        { role: 'user', content: prompt },
      ],
    });

    return JSON.parse(completion.choices[0]?.message?.content);
  } catch (err) {
    console.error('[Analyzer] Error en Groq:', err.message);
    return null;
  }
}

module.exports = { analyze };
