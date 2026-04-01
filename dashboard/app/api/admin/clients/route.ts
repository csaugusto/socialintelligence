import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const db = require('../../../../../src/db/index.js');
  const clients = await db.listAllClients();
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { name, slug, type, coverage, region, vertical } = await req.json();
  if (!name || !slug || !type || !coverage) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const db = require('../../../../../src/db/index.js');
  try {
    const client = await db.saveClient({ name, slug, type, coverage, region, vertical: vertical || 'media' });
    return NextResponse.json(client, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
