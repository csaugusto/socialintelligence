const Groq = require('groq-sdk');

let client = null;
function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

const SITE_NAME = process.env.SITE_NAME || 'Social Intelligence';

/**
 * Dado un trend topic, genera una nota periodística completa.
 * Devuelve objeto con title, excerpt, content, category, tags, decayType.
 */
async function generate(topic) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[Generator] GROQ_API_KEY no configurada.');
    return null;
  }

  const prompt = buildPrompt(topic);

  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Eres un redactor de noticias mexicano. Respondes ÚNICAMENTE con JSON válido, sin texto adicional.',
        },
        {
          role: 'user',
          content: prompt,
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

  return `Eres redactor de ${SITE_NAME}, un medio digital de noticias mexicano en español.

TEMA TRENDING: ${topic.keyword}
${topic.excerpt ? `CONTEXTO ADICIONAL: ${topic.excerpt}` : ''}
HORA: ${hora} | FECHA: ${fecha}

Escribe una nota periodística completa sobre este tema. Devuelve este JSON exacto:

{
  "title": "título de la nota, directo e informativo, max 90 caracteres",
  "excerpt": "resumen de 2-3 oraciones para el encabezado, max 200 caracteres",
  "content": "cuerpo completo de la nota en HTML, mínimo 4 párrafos con etiquetas <p>. Incluye contexto, antecedentes y cierre. Escribe en español mexicano, estilo periodístico formal.",
  "category": "una de estas: politica | economia | seguridad | deportes | entretenimiento | tecnologia | salud | cultura | internacional",
  "tags": ["tag1", "tag2", "tag3"],
  "decayType": "una de estas: INMEDIATA | CORTA | NORMAL | EVERGREEN",
  "isBreaking": false,
  "hasVideo": false,
  "isLocal": true
}

REGLAS:
- decayType INMEDIATA: sismos, balaceras, alertas. CORTA: accidentes, detenciones. NORMAL: política, deportes. EVERGREEN: cultura, guías.
- isLocal: true si el tema es principalmente de México, false si es internacional.
- No uses comillas dobles dentro de strings. Usa comillas simples si es necesario.
- El content debe ser HTML válido con etiquetas <p>.`;
}

function validate(parsed, topic) {
  const validCategories = ['politica', 'economia', 'seguridad', 'deportes', 'entretenimiento', 'tecnologia', 'salud', 'cultura', 'internacional'];
  const validDecay = ['INMEDIATA', 'CORTA', 'NORMAL', 'EVERGREEN'];

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
    sourceTrend: topic.keyword,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generate };
