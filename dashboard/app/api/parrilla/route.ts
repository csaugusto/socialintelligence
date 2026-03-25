import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const PARRILLA_FILE = path.join(process.cwd(), '..', 'data', 'parrilla.json');

function readParrilla() {
  if (!fs.existsSync(PARRILLA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(PARRILLA_FILE, 'utf8')); } catch { return []; }
}

function writeParrilla(items: unknown[]) {
  const dir = path.dirname(PARRILLA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PARRILLA_FILE, JSON.stringify(items, null, 2));
}

function detectConflicts(allItems: any[], item: any) {
  const itemHour = new Date(item.scheduledFor);
  itemHour.setMinutes(0, 0, 0);

  return allItems
    .filter(other => {
      if (other.id === item.id) return false;
      if (other.network !== item.network) return false;
      const otherHour = new Date(other.scheduledFor);
      otherHour.setMinutes(0, 0, 0);
      return otherHour.getTime() === itemHour.getTime();
    })
    .map((o: any) => o.id);
}

export async function GET() {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const items = readParrilla();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const active = items.filter((i: any) => i.scheduledFor > cutoff);

  const withConflicts = active.map((item: any) => ({
    ...item,
    conflicts: detectConflicts(active, item),
  }));

  return NextResponse.json(withConflicts);
}

export async function POST(req: NextRequest) {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { articleId, articleTitle, network, scheduledFor, copy, hashtags } = await req.json();
  if (!articleId || !network || !scheduledFor) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const items = readParrilla();
  const item = {
    id: Date.now().toString(),
    articleId,
    articleTitle,
    network,
    scheduledFor,
    copy: copy || null,
    hashtags: hashtags || [],
    addedAt: new Date().toISOString(),
  };

  items.push(item);
  items.sort((a: any, b: any) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  writeParrilla(items);

  const conflicts = detectConflicts(items, item);
  return NextResponse.json({ item, conflicts });
}

export async function DELETE(req: NextRequest) {
  const authed = await getSession();
  if (!authed) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  const items = readParrilla().filter((i: any) => i.id !== id);
  writeParrilla(items);
  return NextResponse.json({ ok: true });
}
