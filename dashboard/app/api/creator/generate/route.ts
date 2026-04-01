import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

function mapArticle(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    decayType: row.decay_type ?? row.decayType,
    isBreaking: row.is_breaking ?? row.isBreaking ?? false,
    hasVideo: row.has_video ?? row.hasVideo ?? false,
    sourceTrend: row.source_trend ?? row.sourceTrend,
    tags: row.tags,
    copy: row.copy,
    hashtags: row.hashtags,
    scores: row.scores,
    trendContext: row.trend_context ?? row.trendContext,
    brief: row.brief ?? null,
    angle: row.angle ?? null,
    createdAt: row.created_at ?? row.createdAt,
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { topic } = await req.json();
  if (!topic?.keyword) {
    return NextResponse.json({ error: 'Falta el topic' }, { status: 400 });
  }

  try {
    const db                = require('../../../../../src/db/index.js');
    const creatorGen        = require('../../../../../src/generator/creator.js');
    const scorer            = require('../../../../../src/scorer/index.js');
    const { buildCreatorConfig } = require('../../../../../src/scorer/creatorConfig.js');

    const profile = await db.getClientProfile(session.clientId);
    if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 404 });

    const nota = await creatorGen.generate(topic, profile);
    if (!nota) {
      return NextResponse.json({ error: 'Este tema no conecta con tu nicho' }, { status: 422 });
    }

    const trendContext = {
      keyword:     topic.keyword,
      sources:     topic.sources || [topic.source],
      crossSource: topic.crossSource || false,
      trendScore:  topic.score,
    };

    const creatorConfig = buildCreatorConfig(profile);
    const scores = await scorer.score(nota, trendContext, creatorConfig);
    const saved  = await db.saveArticle({
      nota, scores,
      ghostPost: null,
      clientId: session.clientId,
      trendContext,
    });

    return NextResponse.json(mapArticle(saved));

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/generate]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
