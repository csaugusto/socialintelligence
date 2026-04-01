import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getClientProfile, getClient } from '@/lib/db';
import Dashboard from './dashboard';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  let vertical = 'media';

  // Superadmin entra directo — no tiene cliente ni perfil propio
  if (session.role !== 'superadmin') {
    const profile = await getClientProfile(session.clientId);
    if (!profile) redirect('/onboarding');
    const client = await getClient(session.clientId);
    if (client?.vertical) vertical = client.vertical;
  }

  return <Dashboard role={session.role} vertical={vertical} />;
}
