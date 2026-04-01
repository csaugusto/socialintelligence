import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const db = require('../../../../../src/db/index.js');
  const articles = await db.getRecentArticles(200, session.clientId);
  const article = articles.find((a: { id: string }) => a.id === id);
  if (!article) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });

  // Cargar config del cliente para scoring personalizado
  let clientConfig = {};
  try {
    const scorerConfig = await db.getClientScorerConfig(session.clientId);
    const clientProfile = await db.getClientProfile(session.clientId);
    if (scorerConfig || clientProfile) {
      clientConfig = {
        ...(scorerConfig || {}),
        profile_narrative: clientProfile?.profile_narrative || null,
      };
    }
  } catch {
    // Sin config de cliente — usa defaults
  }

  const scorer = require('../../../../../src/scorer/index.js');
  const trendContext = article.trend_context || article.trendContext || {};
  const newScores = await scorer.score(
    {
      category: article.category,
      decayType: article.decay_type || article.decayType,
      isBreaking: article.is_breaking || article.isBreaking || false,
      hasVideo: article.has_video || article.hasVideo || false,
      isLocal: article.is_local ?? article.isLocal ?? true,
    },
    trendContext,
    clientConfig
  );

  const updated = await db.updateArticleScores(id, newScores);
  const reanalyzedAt = updated?.reanalyzed_at || updated?.reanalyzedAt || new Date().toISOString();
  return NextResponse.json({ scores: newScores, reanalyzedAt });
}
