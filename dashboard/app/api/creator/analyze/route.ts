import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const db       = require('../../../../../src/db/index.js');
    const connectors = require('../../../../../src/connectors/index.js');
    const analyzer   = require('../../../../../src/analyzer/contentAnalyzer.js');

    const [accounts, profile] = await Promise.all([
      db.getSocialAccounts(session.clientId),
      db.getClientProfile(session.clientId),
    ]);

    if (!accounts.length) {
      return NextResponse.json({ error: 'Sin cuentas conectadas' }, { status: 400 });
    }

    const accountsData = await connectors.fetchAllAccounts(accounts);
    if (!accountsData.length) {
      return NextResponse.json({ error: 'No se pudo obtener contenido de las cuentas' }, { status: 400 });
    }

    const patterns = await analyzer.analyze(accountsData, profile);
    if (!patterns) {
      return NextResponse.json({ error: 'No se pudo analizar el contenido' }, { status: 500 });
    }

    await db.saveContentPatterns(session.clientId, patterns);
    await db.saveSocialAccount(session.clientId, {
      platform: accounts[0].platform,
      username: accounts[0].username,
      channelId: accounts[0].channel_id,
      connectionType: accounts[0].connection_type,
    });

    return NextResponse.json({ success: true, patterns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/creator/analyze]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
