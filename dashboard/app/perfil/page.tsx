import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getClientProfile, getClient } from '@/lib/db';
import PerfilCreator from './perfil-creator';

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [profile, client] = await Promise.all([
    getClientProfile(session.clientId),
    getClient(session.clientId),
  ]);

  if (!profile) redirect('/onboarding');
  if (client?.vertical !== 'creator') redirect('/');

  return <PerfilCreator profile={profile} />;
}
