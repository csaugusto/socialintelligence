const Groq = require('groq-sdk');

let client = null;
function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

const SITE_NAME = process.env.SITE_NAME || 'Social Intelligence';

async function generate(topic) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[Generator] GROQ_API_KEY no configurada.');
    return null;
  }

  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Eres un redactor de noticias mexicano y estratega de redes sociales. Respondes ÚNICAMENTE con JSON válido, sin texto adicional.',
        },
        {
          role: 'user',
          content: buildPrompt(topic),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);
    return validate(parsed, topic);

  } catch (err) {
    console.error('[Generator] Error al generar nota:', err.message);
    return null;
  }
}

function buildPrompt(topic) {
  const now = new Date();
  const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `Eres redactor y estratega de redes sociales de ${SITE_NAME}, medio digital mexicano.

TEMA TRENDING: ${topic.keyword}
${topic.excerpt ? `CONTEXTO: ${topic.excerpt}` : ''}
HORA: ${hora} | FECHA: ${fecha}

Devuelve este JSON exacto (sin texto fuera del JSON):

{
  "title": "título periodístico directo, max 90 caracteres",
  "excerpt": "resumen 2-3 oraciones, max 200 caracteres",
  "content": "cuerpo en HTML con mínimo 4 párrafos <p>. Estilo periodístico formal, español mexicano.",
  "category": "politica|economia|seguridad|deportes|entretenimiento|tecnologia|salud|cultura|internacional",
  "tags": ["tag1", "tag2", "tag3"],
  "decayType": "INMEDIATA|CORTA|NORMAL|EVERGREEN",
  "isBreaking": false,
  "hasVideo": false,
  "isLocal": true,
  "copy": {
    "instagram": "gancho emocional + contexto, emojis naturales, max 140 caracteres",
    "x": "emoji + titular impactante + dato clave, max 200 caracteres",
    "facebook": "entrada narrativa que invite a leer la nota completa, max 160 caracteres",
    "tiktok": "pie de video impactante, lo más sorprendente primero, max 120 caracteres"
  },
  "hashtags": {
    "instagram": ["#hashtag1", "#hashtag2", "#hashtag3"],
    "x": ["#hashtag1", "#hashtag2"],
    "facebook": ["#hashtag1", "#hashtag2"],
    "tiktok": ["#hashtag1", "#hashtag2", "#hashtag3"]
  }
}

REGLAS:
- decayType: INMEDIATA=sismos/balaceras/alertas, CORTA=accidentes/detenciones, NORMAL=política/deportes, EVERGREEN=cultura/guías
- isLocal: true si el tema es principalmente de México
- copy: listo para copiar y pegar, sin comillas dobles adentro
- hashtags: en español, relevantes al tema
- No uses comillas dobles dentro de valores string`;
}

function validate(parsed, topic) {
  const validCategories = ['politica', 'economia', 'seguridad', 'deportes', 'entretenimiento', 'tecnologia', 'salud', 'cultura', 'internacional'];
  const validDecay = ['INMEDIATA', 'CORTA', 'NORMAL', 'EVERGREEN'];

  const defaultCopy = {
    instagram: `📰 ${parsed.title || topic.keyword}`,
    x: `🔴 ${parsed.title || topic.keyword}`,
    facebook: parsed.excerpt || parsed.title || topic.keyword,
    tiktok: `🎬 ${parsed.title || topic.keyword}`,
  };

  const defaultHashtags = {
    instagram: ['#Mexico', '#Noticias'],
    x: ['#Mexico'],
    facebook: ['#Mexico', '#Noticias'],
    tiktok: ['#Mexico', '#Noticias', '#FYP'],
  };

  return {
    title: parsed.title || topic.keyword,
    excerpt: parsed.excerpt || '',
    content: parsed.content || '<p>Contenido no disponible.</p>',
    category: validCategories.includes(parsed.category) ? parsed.category : 'internacional',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [topic.keyword],
    decayType: validDecay.includes(parsed.decayType) ? parsed.decayType : 'NORMAL',
    isBreaking: Boolean(parsed.isBreaking),
    hasVideo: Boolean(parsed.hasVideo),
    isLocal: parsed.isLocal !== false,
    copy: parsed.copy || defaultCopy,
    hashtags: parsed.hashtags || defaultHashtags,
    sourceTrend: topic.keyword,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generate };
