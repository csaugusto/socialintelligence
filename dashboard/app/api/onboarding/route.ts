import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const {
  generateScorerConfig, generateProfileNarrative,
  generateCreatorScorerConfig, generateCreatorProfileNarrative,
} = require('../../../../src/onboarding/processor.js');

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
    const { clientName, clientType, clientCoverage, clientRegion, vertical, answers } = body;

    if (!clientName || !answers) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = require('../../../../src/db/index.js');
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
