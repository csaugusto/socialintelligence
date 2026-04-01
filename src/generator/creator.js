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

const FORMAT_BY_NETWORK = {
  instagram: ['Reel 15–30s', 'Reel 30–60s', 'Carrusel (5–8 slides)', 'Story + enlace'],
  tiktok:    ['Video 15–30s', 'Video 30–60s', 'Video 60–90s', 'Duet / Stitch'],
  youtube:   ['Short 60s', 'Video 5–10min', 'Video 10–20min'],
  x:         ['Hilo (5–8 tweets)', 'Tweet + imagen', 'Tweet + video'],
  facebook:  ['Video corto', 'Carrusel', 'Post + imagen'],
  linkedin:  ['Carrusel PDF', 'Post reflexión', 'Video corto'],
};

/**
 * Genera un brief creativo para un creator.
 * @param {object} topic  - Trend detectado { keyword, excerpt, score, ... }
 * @param {object} profile - Perfil del creator { main_category, categories, primary_network, active_networks, audience_age_range, produces_video, editorial_schedule }
 * @returns {object|null} Brief creativo o null si el tema no es relevante para el nicho
 */
async function generate(topic, profile) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[Generator/Creator] GROQ_API_KEY no configurada.');
    return null;
  }

  const nichoLabel = NICHO_LABELS[profile.main_category] || profile.main_category || 'General';
  const primaryNet = profile.primary_network || 'instagram';
  const formats    = FORMAT_BY_NETWORK[primaryNet] || FORMAT_BY_NETWORK.instagram;

  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Eres un estratega de contenido para creators de redes sociales. Tu trabajo es identificar si un tema trending es relevante para el nicho del creator y, si lo es, generar un brief creativo accionable. Respondes ÚNICAMENTE con JSON válido.',
        },
        {
          role: 'user',
          content: buildPrompt(topic, profile, nichoLabel, primaryNet, formats),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);

    if (!parsed.relevant) {
      console.log(`[Generator/Creator] Tema "${topic.keyword}" descartado: no relevante para nicho "${nichoLabel}"`);
      return null;
    }

    return validate(parsed, topic, profile);

  } catch (err) {
    console.error('[Generator/Creator] Error:', err.message);
    return null;
  }
}

function buildPrompt(topic, profile, nichoLabel, primaryNet, formats) {
  const now     = new Date();
  const hora    = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const fecha   = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const audiencia = profile.audience_age_range ? `Audiencia: ${profile.audience_age_range} años` : '';
  const secondaryNichos = (profile.categories || []).filter(c => c !== profile.main_category).map(c => NICHO_LABELS[c] || c);

  const patterns = profile.content_patterns;
  const patternsStr = patterns ? `
ANÁLISIS DE SU CONTENIDO PUBLICADO:
- Temas que más le funcionan: ${(patterns.top_topics || []).join(', ')}
- Formatos ganadores: ${(patterns.top_formats || []).join(', ')}
- Hooks que usa: ${(patterns.hook_patterns || []).join(' | ')}
- Tono y voz: ${patterns.tone || 'no analizado'}
- Qué funciona: ${patterns.what_works || ''}
- Pilares de contenido: ${(patterns.content_pillars || []).join(', ')}
- Evitar: ${(patterns.avoid || []).join(', ')}
- Duración ideal: ${patterns.recommended_duration || 'no definida'}
` : '';

  return `PERFIL DEL CREATOR:
- Nicho principal: ${nichoLabel}
- Nichos secundarios: ${secondaryNichos.join(', ') || 'ninguno'}
- Red principal: ${primaryNet}
- Redes activas: ${(profile.active_networks || [primaryNet]).join(', ')}
${audiencia}
- Produce video: ${profile.produces_video ? 'sí' : 'no'}
${patternsStr}

TEMA TRENDING: "${topic.keyword}"
${topic.excerpt ? `CONTEXTO: ${topic.excerpt}` : ''}
HORA: ${hora} | FECHA: ${fecha}

INSTRUCCIÓN:
1. Evalúa si este tema trending es relevante o puede adaptarse al nicho "${nichoLabel}". Sé creativo — busca el ángulo que conecte el tema con el nicho aunque no sea obvio. Si definitivamente no tiene ángulo para este nicho, márcalo como no relevante.
2. Si es relevante, genera un brief creativo completo.

Devuelve este JSON exacto:

{
  "relevant": true,
  "relevance_reason": "por qué este tema conecta con el nicho (o por qué no)",
  "angle": "el ángulo creativo que conecta el tema con el nicho del creator",
  "title": "título del contenido, max 90 caracteres, atractivo y específico",
  "excerpt": "qué trata este contenido, 1-2 oraciones",
  "decayType": "INMEDIATA|CORTA|NORMAL|EVERGREEN",
  "brief": {
    "formato": "${formats[0]|formats[1]}",
    "duracion": "duración o cantidad sugerida, ej: 45 segundos, 6 slides",
    "gancho": "la primera frase o imagen que abrirá el contenido — debe generar curiosidad o impacto inmediato",
    "desarrollo": [
      "punto 1 a cubrir con detalle específico",
      "punto 2 a cubrir con detalle específico",
      "punto 3 a cubrir con detalle específico"
    ],
    "cierre": "cómo cerrar el video/post — incluye el call to action",
    "tip_produccion": "consejo práctico de producción para este formato y red",
    "fuentes": [
      "fuente o referencia que el creator puede consultar para documentarse — da el nombre del medio o término de búsqueda específico"
    ]
  },
  "copy": {
    "${primaryNet}": "copy optimizado para ${primaryNet}, listo para publicar con emojis naturales, max 150 caracteres",
    "instagram": "gancho emocional + contexto, emojis naturales, max 140 caracteres",
    "tiktok": "pie de video impactante, lo más sorprendente primero, max 120 caracteres",
    "x": "emoji + dato clave + hook, max 200 caracteres",
    "facebook": "entrada narrativa que invite a ver el contenido, max 160 caracteres"
  },
  "hashtags": {
    "${primaryNet}": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4"],
    "instagram": ["#hashtag1", "#hashtag2", "#hashtag3"],
    "tiktok": ["#hashtag1", "#hashtag2", "#hashtag3", "#FYP"],
    "x": ["#hashtag1", "#hashtag2"],
    "facebook": ["#hashtag1", "#hashtag2"]
  }
}

REGLAS:
- Si relevant es false, puedes omitir todos los demás campos excepto relevance_reason
- El ángulo debe ser honesto — no fuerces conexiones que no existen
- El brief debe ser accionable: el creator puede producir el contenido solo con leerlo
- Las fuentes deben ser términos de búsqueda específicos o medios reales, no URLs inventadas
- decayType: INMEDIATA=tendencia de horas, CORTA=días, NORMAL=semanas, EVERGREEN=siempre relevante
- Escribe en español mexicano natural`;
}

function validate(parsed, topic, profile) {
  const primaryNet = profile.primary_network || 'instagram';
  const validDecay = ['INMEDIATA', 'CORTA', 'NORMAL', 'EVERGREEN'];

  const defaultCopy = {
    instagram: `✨ ${parsed.title || topic.keyword}`,
    tiktok:    `🎬 ${parsed.title || topic.keyword}`,
    x:         `🔥 ${parsed.title || topic.keyword}`,
    facebook:  parsed.title || topic.keyword,
  };
  if (primaryNet && !defaultCopy[primaryNet]) defaultCopy[primaryNet] = parsed.title || topic.keyword;

  const defaultHashtags = {
    instagram: ['#CreadorDeContenido', '#Mexico'],
    tiktok:    ['#Mexico', '#FYP', '#CreadorDeContenido'],
    x:         ['#Mexico', '#CreadorDeContenido'],
    facebook:  ['#Mexico', '#CreadorDeContenido'],
  };

  return {
    title:         parsed.title || topic.keyword,
    excerpt:       parsed.excerpt || '',
    angle:         parsed.angle || '',
    content:       null, // creators no tienen artículo de blog
    category:      profile.main_category || 'entretenimiento',
    tags:          [topic.keyword, profile.main_category].filter(Boolean),
    decayType:     validDecay.includes(parsed.decayType) ? parsed.decayType : 'NORMAL',
    isBreaking:    false,
    hasVideo:      profile.produces_video || false,
    isLocal:       true,
    brief:         parsed.brief || null,
    copy:          parsed.copy || defaultCopy,
    hashtags:      parsed.hashtags || defaultHashtags,
    sourceTrend:   topic.keyword,
    generatedAt:   new Date().toISOString(),
  };
}

module.exports = { generate };
