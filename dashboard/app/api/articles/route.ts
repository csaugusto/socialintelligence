import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const dataFile = path.join(process.cwd(), '..', 'data', 'articles.json');

  if (!fs.existsSync(dataFile)) {
    return NextResponse.json([]);
  }

  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const articles = JSON.parse(raw);
    return NextResponse.json(articles);
  } catch {
    return NextResponse.json([]);
  }
}
