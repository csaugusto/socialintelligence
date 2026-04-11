import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { handle } = await req.json();
  if (!handle?.trim()) return NextResponse.json({ error: 'Falta el handle' }, { status: 400 });

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY no configurada' }, { status: 503 });
  }

  try {
    const ytConnector = require('../../../../../src/connectors/youtube.js');
    const analyzer    = require('../../../../../src/analyzer/contentAnalyzer.js');

    const result = await ytConnector.fetch({ username: handle.trim(), connection_type: 'public' });

    if (!result.posts?.length) {
      return NextResponse.json(
        { error: 'No se encontró el canal o no tiene videos públicos' },
        { status: 404 }
      );
    }

    const patterns = await analyzer.analyze([result], { main_category: null });

    return NextResponse.json({
      channelId:        result.channelId,
      postCount:        result.posts.length,
      content_patterns: patterns,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/analyze-channel]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
