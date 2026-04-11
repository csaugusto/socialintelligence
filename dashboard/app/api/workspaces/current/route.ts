import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const { buildUserProfile } = require('../../../../../src/lib/ai-profile.js');

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const db = require('../../../../../src/db/index.js');
  const workspaces = await db.getUserWorkspaces(session.userId);
  const current = workspaces.find((w: { id: string }) => w.id === session.workspaceId) || workspaces[0] || null;
  return NextResponse.json({ workspace: current });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { name, type } = body;

  const db = require('../../../../../src/db/index.js');
  const workspace = await db.updateWorkspaceBasic(session.workspaceId, { name, type });

  // Regenerar perfil de IA si el workspace tiene datos de onboarding
  if (workspace) {
    const profile = await db.getClientProfile(session.workspaceId);
    if (profile) {
      // Reconstruir wizardData desde workspace_profiles para el buildUserProfile
      const wizardData = {
        objectives:          profile.objectives || [],
        platforms:           profile.active_networks || [],
        nicho:               profile.nicho || profile.categories || [],
        customNicho:         '',
        pillars:             profile.content_pillars || [],
        competitors:         [],   // los competidores se regeneran solo en onboarding completo
        frequency:           profile.posting_frequency || '',
        productionCapacity:  profile.production_capacity || '',
        tone:                profile.tone?.[0] || '',
        toneAvoid:           profile.tone_limits?.avoid_topics || [],
        controversyLevel:    profile.tone_limits?.controversy_level ?? 1,
      };
      const aiProfile = buildUserProfile(workspace, wizardData);
      await db.saveAiProfile(session.workspaceId, aiProfile);
    }
  }

  return NextResponse.json({ workspace });
}
