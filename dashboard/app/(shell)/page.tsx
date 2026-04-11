import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import HomeClient from './home-client';

const db            = require('../../../src/db/index.js');
const { getDashboardConfig } = require('../../../src/lib/dashboard-config.js');

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params      = await searchParams;
  const rawViewAs   = params.viewAs;
  const viewAsId    = session.role === 'superadmin' && typeof rawViewAs === 'string' && rawViewAs
    ? rawViewAs
    : null;
  const effectiveId = viewAsId || session.workspaceId || session.clientId;

  // Redirigir a onboarding si no hay perfil aún
  const profile = await db.getClientProfile(effectiveId);
  if (!profile && !viewAsId) redirect('/onboarding');

  const workspace = await db.getClient(effectiveId);

  // Configuración personalizada según tipo de cuenta + objetivos
  const config = getDashboardConfig(workspace, profile);

  return (
    <HomeClient
      welcomeTitle={config.welcomeTitle}
      welcomeSubtitle={config.welcomeSubtitle}
      kpis={config.kpis}
      featuredModules={config.featuredModules}
      emptyTitle={config.emptyTitle}
      emptyBody={config.emptyBody}
      workspaceName={workspace?.name || ''}
    />
  );
}
