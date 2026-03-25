import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const dataFile = path.join(process.cwd(), '..', 'data', 'articles.json');
  if (!fs.existsSync(dataFile)) return NextResponse.json({ error: 'Sin datos' }, { status: 404 });

  const articles = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const idx = articles.findIndex((a: { id: string }) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });

  const article = articles[idx];

  // Recalcular scores con hora actual
  const scorer = require('../../../../../src/scorer/index.js');
  const newScores = scorer.score({
    category: article.category,
    decayType: article.decayType,
    isBreaking: article.isBreaking || false,
    hasVideo: article.hasVideo || false,
    isLocal: article.isLocal !== false,
  });

  articles[idx].scores = newScores;
  articles[idx].reanalyzedAt = new Date().toISOString();
  fs.writeFileSync(dataFile, JSON.stringify(articles, null, 2));

  return NextResponse.json({ scores: newScores, reanalyzedAt: articles[idx].reanalyzedAt });
}
