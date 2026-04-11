import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const {
  generateScorerConfig, generateProfileNarrative,
  generateCreatorScorerConfig, generateCreatorProfileNarrative,
} = require('../../../../src/onboarding/processor.js');

const { buildUserProfile } = require('../../../../src/lib/ai-profile.js');

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const db          = require('../../../../src/db/index.js');
    const workspaceId = session.workspaceId || session.clientId;

    const [workspace, profile, competitors, socialAccounts] = await Promise.all([
      db.getClient(workspaceId),
      db.getClientProfile(workspaceId),
      db.getCompetitors(workspaceId),
      db.getSocialAccounts(workspaceId),
    ]);

    const youtubeAccount = socialAccounts?.find((a: { platform: string; username: string }) => a.platform === 'youtube');

    if (!profile) return NextResponse.json(null);

    const toneLimits = typeof profile.tone_limits === 'string'
      ? JSON.parse(profile.tone_limits)
      : (profile.tone_limits || {});

    return NextResponse.json({
      accountType:        workspace?.type || '',
      objectives:         profile.objectives         || [],
      platforms:          profile.active_networks    || [],
      youtubeHandle:      youtubeAccount?.username || '',
      contentPatterns:    profile.content_patterns   || null,
      nicho:              profile.categories         || [],
      customNicho:        '',
      pillars:            profile.content_pillars    || [],
      competitors:        competitors,
      frequency:          profile.posting_frequency  || '',
      productionCapacity: profile.production_capacity || '',
      tone:               Array.isArray(profile.tone) ? (profile.tone[0] || '') : (profile.tone || ''),
      toneAvoid:          toneLimits.avoid_topics    || [],
      controversyLevel:   toneLimits.controversy_level ?? 1,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const db = require('../../../../src/db/index.js');

    const updates: Record<string, unknown> = {};
    if (body.categories        !== undefined) updates.categories        = body.categories;
    if (body.main_category     !== undefined) updates.main_category     = body.main_category;
    if (body.active_networks   !== undefined) updates.active_networks   = body.active_networks;
    if (body.primary_network   !== undefined) updates.primary_network   = body.primary_network;
    if (body.produces_video    !== undefined) updates.produces_video    = body.produces_video;
    if (body.team_size         !== undefined) updates.team_size         = body.team_size;
    if (body.audience_age_range !== undefined) updates.audience_age_range = body.audience_age_range;
    if (body.editorial_schedule !== undefined) updates.editorial_schedule = body.editorial_schedule;

    await db.saveClientProfile(session.clientId, updates);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const db = require('../../../../src/db/index.js');

    // Nuevo wizard de onboarding
    if (body.wizard === true) {
      const { data } = body;
      if (!data) return NextResponse.json({ success: false, error: 'Faltan datos del wizard' }, { status: 400 });

      const workspaceId = session.workspaceId || session.clientId;

      // 1. Guardar datos del wizard en workspace_profiles + competitors
      await db.saveWizardData(workspaceId, data);

      // 2. Compilar y persistir el perfil de IA
      // Si el wizard no trajo contentPatterns (usuario saltó el step),
      // recuperar los que ya estaban en DB para no perderlos del ai_profile
      const workspace = await db.getClient(workspaceId);
      if (workspace) {
        let contentPatterns = data.contentPatterns ?? null;
        if (!contentPatterns) {
          const existingProfile = await db.getClientProfile(workspaceId);
          contentPatterns = existingProfile?.content_patterns ?? null;
        }
        const aiProfile = buildUserProfile(workspace, { ...data, contentPatterns });
        await db.saveAiProfile(workspaceId, aiProfile);
      }

      // DEBUG — leer el perfil guardado y loggearlo completo
      const savedProfile = await db.getClientProfile(workspaceId);
      const savedWorkspace = await db.getClient(workspaceId);
      console.log('\n══════════════════════════════════════════');
      console.log('[Onboarding] Perfil guardado en DB:');
      console.log('  main_category:      ', savedProfile?.main_category);
      console.log('  categories:         ', savedProfile?.categories);
      console.log('  primary_network:    ', savedProfile?.primary_network);
      console.log('  active_networks:    ', savedProfile?.active_networks);
      console.log('  produces_video:     ', savedProfile?.produces_video);
      console.log('  objectives:         ', savedProfile?.objectives);
      console.log('  content_pillars:    ', savedProfile?.content_pillars);
      console.log('  posting_frequency:  ', savedProfile?.posting_frequency);
      console.log('  production_capacity:', savedProfile?.production_capacity);
      console.log('  tone:               ', savedProfile?.tone);
      console.log('  tone_limits:        ', savedProfile?.tone_limits);
      console.log('  content_patterns:   ', savedProfile?.content_patterns ? '✓ presentes' : '(sin análisis de canal)');
      console.log('[Onboarding] ai_profile compilado:');
      console.log(savedWorkspace?.ai_profile || '(vacío)');
      console.log('══════════════════════════════════════════\n');

      return NextResponse.json({ success: true });
    }

    // Flujo legacy
    const { clientName, clientType, clientCoverage, clientRegion, vertical, answers } = body;

    if (!clientName || !answers) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const isCreator = vertical === 'creator';

    const scorerConfig     = isCreator ? generateCreatorScorerConfig(answers) : generateScorerConfig(answers);
    const profileNarrative = isCreator
      ? generateCreatorProfileNarrative(answers, clientName)
      : generateProfileNarrative(answers, clientName, clientType, clientCoverage, clientRegion ?? null);

    await db.saveClientProfile(session.clientId, {
      categories:          isCreator ? (answers.nichos || []) : (answers.categories || []),
      main_category:       isCreator ? (answers.main_nicho || null) : (answers.main_category || null),
      produces_video:      isCreator ? answers.formatos?.includes('video_corto') || answers.formatos?.includes('video_largo') : (answers.produces_video || false),
      covers_breaking:     answers.covers_breaking || false,
      active_networks:     answers.active_networks || [],
      primary_network:     answers.primary_network || null,
      editorial_schedule:  answers.editorial_schedule || null,
      team_size:           answers.team_size || null,
      audience_age_range:  answers.audience_age_range || answers.audience_age || null,
      known_peak_hours:    answers.known_peak_hours || null,
      profile_narrative:   profileNarrative,
    });

    await db.saveClientScorerConfig(session.clientId, scorerConfig);

    return NextResponse.json({ success: true, scorerConfig, profileNarrative });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}
