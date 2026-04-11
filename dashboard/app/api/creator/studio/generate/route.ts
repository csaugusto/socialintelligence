import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const NETWORK_LABELS: Record<string, string> = {
  tiktok:    'TikTok',
  instagram: 'Instagram',
  youtube:   'YouTube',
  x:         'X (Twitter)',
  facebook:  'Facebook',
  linkedin:  'LinkedIn',
};

const NETWORK_MAX_CHARS: Record<string, number> = {
  tiktok: 2200, instagram: 2200, youtube: 5000, x: 280, facebook: 63206, linkedin: 3000,
};

const TAB_INSTRUCTIONS: Record<string, (ctx: TabContext) => string> = {
  gancho: ctx => `
Genera el GANCHO de apertura para un video de ${ctx.networkLabel}.
Es la primera frase/imagen que aparece — tiene 3 segundos para detener el scroll.

Reglas:
- Una sola frase poderosa (máx 15 palabras)
- Puede ser: pregunta disruptiva, dato sorprendente, afirmación polémica, o promesa específica
- NO empieces con "Hoy", "En este video", ni saludos
- Debe crear tensión o curiosidad inmediata
- Tono: ${ctx.tone}
- Nivel de controversia: ${ctx.controversyLevel}

Tema: "${ctx.title}"
${ctx.angle ? `Ángulo: ${ctx.angle}` : ''}

Devuelve ÚNICAMENTE el texto del gancho, sin explicaciones ni comillas.`,

  guion: ctx => `
Genera el GUION COMPLETO para un video de ${ctx.networkLabel}.
${ctx.duration ? `Duración objetivo: ${ctx.duration}.` : ''}

Estructura obligatoria:
1. GANCHO (3-5 seg): la frase de apertura que engancha
2. DESARROLLO (3 puntos concretos, con ejemplos o datos específicos)
3. CIERRE (conclusión que conecta con la audiencia)
4. CTA (llamada a la acción clara y natural)

Contexto del creator:
- Tono: ${ctx.tone}
- Pilares de contenido: ${ctx.pillars}
${ctx.whatWorks ? `- Lo que funciona en su canal: ${ctx.whatWorks}` : ''}

Tema: "${ctx.title}"
${ctx.angle ? `Ángulo: ${ctx.angle}` : ''}

Escribe el guion listo para grabar, en español mexicano natural. Sin títulos de sección — el guion fluye directo.`,

  caption: ctx => `
Genera el CAPTION optimizado para ${ctx.networkLabel}.
Límite de caracteres: ${ctx.maxChars}.

Requisitos:
- Abre con el gancho más fuerte (no empieces con el nombre del creator ni hashtags)
- Incluye contexto o valor en 2-3 oraciones
- Cierra con CTA natural (pregunta, "guarda esto", "sígueme para más", etc.)
- Emojis naturales integrados al texto, no al final en bloque
- Tono: ${ctx.tone}

Tema: "${ctx.title}"
${ctx.angle ? `Ángulo: ${ctx.angle}` : ''}

Devuelve ÚNICAMENTE el caption listo para publicar.`,

  cta: ctx => `
Genera 5 LLAMADAS A LA ACCIÓN para el cierre de un video de ${ctx.networkLabel}.
Deben ser naturales al tono del creator, no genéricas.

Tipos a cubrir (una de cada):
1. Que invite a comentar (pregunta específica al tema)
2. Que incentive guardar el video
3. Que invite a seguir la cuenta (con razón específica)
4. Que genere respuesta emocional
5. Que invite a compartir

Tono: ${ctx.tone}
Tema: "${ctx.title}"
${ctx.whatWorks ? `Lo que funciona en su canal: ${ctx.whatWorks}` : ''}

Formato: una CTA por línea, sin numeración ni etiquetas. Lista directa.`,

  articulo: ctx => `
Genera un ARTÍCULO COMPLETO sobre el tema dado.
Extensión: 600-900 palabras. Para blog o newsletter.

Estructura:
# [Título atractivo diferente al original]
[Introducción: 2 párrafos que enganchen y planteen el problema o promesa]

## [Subtítulo 1]
[Contenido con ejemplos concretos]

## [Subtítulo 2]
[Contenido con datos o experiencias]

## [Subtítulo 3]
[El punto más valioso — el "secreto" o insight principal]

## Conclusión
[Cierre que conecte + CTA para comentarios o newsletter]

Tono: ${ctx.tone}
Pilares de contenido: ${ctx.pillars}
Tema: "${ctx.title}"
${ctx.angle ? `Ángulo: ${ctx.angle}` : ''}

Escribe en español mexicano natural. Párrafos cortos, lenguaje accesible.`,

  seo: ctx => `
Genera la OPTIMIZACIÓN SEO completa para este contenido.

Devuelve exactamente en este formato:

TÍTULO SEO (máx 60 chars):
[título aquí]

META DESCRIPCIÓN (máx 155 chars):
[descripción aquí]

URL SUGERIDA:
/[slug-en-minusculas-con-guiones]

PALABRAS CLAVE PRINCIPALES:
[kw1], [kw2], [kw3], [kw4], [kw5]

PALABRAS CLAVE DE COLA LARGA:
[frase larga 1], [frase larga 2], [frase larga 3]

ETIQUETAS PARA VIDEO:
[tag1], [tag2], [tag3], [tag4], [tag5], [tag6], [tag7], [tag8]

Tema: "${ctx.title}"
${ctx.angle ? `Ángulo: ${ctx.angle}` : ''}
Nicho: ${ctx.nicho}`,

  variantes: ctx => `
Genera 3 VARIANTES del mismo contenido con ángulos distintos.

Cada variante debe ser un gancho + 2-3 oraciones de contexto que muestren cómo enfocarías el video.

VARIANTE A — MÁS DIRECTA:
[gancho directo + contexto sin rodeos]

VARIANTE B — MÁS EMOCIONAL:
[gancho emocional + historia personal o conexión humana]

VARIANTE C — MÁS CONTROVERSIAL:
[ángulo que desafíe lo convencional o genere debate sano, respetando nivel de controversia: ${ctx.controversyLevel}]

Tono base: ${ctx.tone}
Tema: "${ctx.title}"
${ctx.angle ? `Ángulo original: ${ctx.angle}` : ''}`,
};

type TabContext = {
  networkLabel:      string;
  maxChars:          number;
  tone:              string;
  controversyLevel:  string;
  pillars:           string;
  nicho:             string;
  whatWorks:         string;
  duration:          string;
  title:             string;
  angle:             string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { tab, title, angle, network } = await req.json();
  if (!tab || !title) return NextResponse.json({ error: 'Faltan tab o title' }, { status: 400 });

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 503 });
  }

  try {
    const db          = require('../../../../../../src/db/index.js');
    const Groq        = require('groq-sdk');
    const { buildSystemPrompt } = require('../../../../../../src/lib/ai-profile.js');

    const workspaceId = session.workspaceId || session.clientId;
    const [workspace, profile] = await Promise.all([
      db.getClient(workspaceId),
      db.getClientProfile(workspaceId),
    ]);

    const cp    = profile?.content_patterns || {};
    const tl    = typeof profile?.tone_limits === 'string'
      ? JSON.parse(profile.tone_limits)
      : (profile?.tone_limits || {});

    const tone  = Array.isArray(profile?.tone) ? profile.tone[0] : (profile?.tone || 'cercano y conversacional');
    const controversyMap: Record<number, string> = {
      0: 'nula — evita cualquier polémica',
      1: 'mínima — solo temas seguros',
      2: 'moderada — opina sin polarizar',
      3: 'alta — dispuesto a generar debate',
    };

    const ctx: TabContext = {
      networkLabel:     NETWORK_LABELS[network] || network,
      maxChars:         NETWORK_MAX_CHARS[network] || 2200,
      tone:             tone,
      controversyLevel: controversyMap[tl.controversy_level ?? 1] || 'mínima',
      pillars:          (profile?.content_pillars || []).join(', ') || 'no definidos',
      nicho:            profile?.main_category || 'general',
      whatWorks:        cp.what_works || '',
      duration:         cp.recommended_duration || '',
      title:            title,
      angle:            angle || '',
    };

    const tabFn = TAB_INSTRUCTIONS[tab];
    if (!tabFn) return NextResponse.json({ error: `Tab desconocido: ${tab}` }, { status: 400 });

    const taskInstructions = `Eres un copywriter experto en contenido para ${NETWORK_LABELS[network] || network}. Escribes en español mexicano natural. Respondes ÚNICAMENTE con el contenido solicitado — sin introducción, sin explicaciones, sin comillas envolventes.`;
    const systemMsg = buildSystemPrompt(workspace, taskInstructions);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens:  1500,
      messages: [
        { role: 'system',  content: systemMsg },
        { role: 'user',    content: tabFn(ctx) },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ content });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/studio/generate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
