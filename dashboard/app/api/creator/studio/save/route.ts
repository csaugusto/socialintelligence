import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET  ?articleId=xxx  → devuelve studio_content guardado
// POST { articleId, title, network, tabs } → guarda studio_content

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const articleId = req.nextUrl.searchParams.get('articleId');
  if (!articleId) return NextResponse.json(null);

  try {
    const db          = require('../../../../../../src/db/index.js');
    const workspaceId = session.workspaceId || session.clientId;

    const res = await db.getStudioContent(workspaceId, articleId);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { articleId, title, network, tabs } = await req.json();
  if (!articleId) return NextResponse.json({ error: 'Falta articleId' }, { status: 400 });

  try {
    const db          = require('../../../../../../src/db/index.js');
    const workspaceId = session.workspaceId || session.clientId;

    await db.saveStudioContent(workspaceId, articleId, {
      title,
      network,
      tabs,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/studio/save]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
