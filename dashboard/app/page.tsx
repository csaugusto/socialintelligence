import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getClientProfile, getClient } from '@/lib/db';
import Dashboard from './dashboard';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  let vertical = 'media';
  let clientName: string | null = null;

  // Superadmin sin impersonar → ir a admin
  if (session.role === 'superadmin' && !session.impersonating) {
    redirect('/admin');
  }

  const profile = await getClientProfile(session.clientId);
  if (!profile) redirect('/onboarding');
  const client = await getClient(session.clientId);
  if (client?.vertical) vertical = client.vertical;
  if (session.impersonating) clientName = client?.name || null;

  return <Dashboard role={session.role} vertical={vertical} impersonating={session.impersonating} clientName={clientName} />;
}
