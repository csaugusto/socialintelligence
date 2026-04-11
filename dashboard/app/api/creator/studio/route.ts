import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const db          = require('../../../../../src/db/index.js');
    const workspaceId = session.workspaceId || session.clientId;

    const [workspace, profile, socialAccounts] = await Promise.all([
      db.getClient(workspaceId),
      db.getClientProfile(workspaceId),
      db.getSocialAccounts(workspaceId),
    ]);

    return NextResponse.json({
      workspaceName:   workspace?.name || '',
      primaryNetwork:  profile?.primary_network || 'instagram',
      activeNetworks:  profile?.active_networks || [],
      socialAccounts:  socialAccounts.map((a: Record<string, unknown>) => ({
        platform: a.platform,
        username: a.username,
      })),
      hasAiProfile:    !!workspace?.ai_profile,
      contentPatterns: profile?.content_patterns || null,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
