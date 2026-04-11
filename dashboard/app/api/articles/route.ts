import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// PostgreSQL devuelve columnas en snake_case. El dashboard espera camelCase.
function mapArticle(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    decayType: row.decay_type ?? row.decayType,
    isBreaking: row.is_breaking ?? row.isBreaking ?? false,
    hasVideo: row.has_video ?? row.hasVideo ?? false,
    isLocal: row.is_local ?? row.isLocal ?? true,
    sourceTrend: row.source_trend ?? row.sourceTrend,
    tags: row.tags,
    copy: row.copy,
    hashtags: row.hashtags,
    scores: row.scores,
    trendContext: row.trend_context ?? row.trendContext,
    ghostId: row.ghost_id ?? row.ghostId,
    ghostUrl: row.ghost_url ?? row.ghostUrl,
    createdAt: row.created_at ?? row.createdAt,
    reanalyzedAt: row.reanalyzed_at ?? row.reanalyzedAt,
    brief: row.brief ?? null,
    angle: row.angle ?? null,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const viewAs = session.role === 'superadmin' ? req.nextUrl.searchParams.get('clientId') : null;
  const clientId = viewAs || session.clientId;

  try {
    const db = require('../../../../src/db/index.js');
    const rows = await db.getRecentArticles(50, clientId);
    return NextResponse.json(rows.map(mapArticle));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/articles] Error:', msg);
    return NextResponse.json({ error: 'Error cargando artículos', detail: msg }, { status: 500 });
  }
}
