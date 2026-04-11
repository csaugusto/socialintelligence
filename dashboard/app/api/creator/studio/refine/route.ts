import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { content, instruction, network, title } = await req.json();
  if (!content || !instruction) {
    return NextResponse.json({ error: 'Faltan content o instruction' }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 503 });
  }

  try {
    const db          = require('../../../../../../src/db/index.js');
    const Groq        = require('groq-sdk');
    const { buildSystemPrompt } = require('../../../../../../src/lib/ai-profile.js');

    const workspaceId = session.workspaceId || session.clientId;
    const workspace   = await db.getClient(workspaceId);

    const taskInstructions = `Eres un editor de contenido experto. Recibes un texto y una instrucción de refinamiento. Devuelves ÚNICAMENTE el texto refinado — sin explicaciones, sin "aquí está la versión refinada", solo el contenido.`;
    const systemMsg = buildSystemPrompt(workspace, taskInstructions);

    const userPrompt = `CONTENIDO ORIGINAL:
${content}

INSTRUCCIÓN: ${instruction}
${title ? `CONTEXTO DEL TEMA: "${title}"` : ''}
${network ? `RED OBJETIVO: ${network}` : ''}

Devuelve el contenido refinado manteniendo el idioma, sin agregar explicaciones.`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens:  1200,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user',   content: userPrompt },
      ],
    });

    const refined = completion.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ content: refined });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/studio/refine]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
