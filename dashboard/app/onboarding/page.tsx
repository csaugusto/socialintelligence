import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getClient } from '@/lib/db';
import OnboardingMedia from './media';
import OnboardingCreator from './creator';

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  let vertical = 'media';
  const client = await getClient(session.clientId);
  if (client?.vertical) vertical = client.vertical;

  return vertical === 'creator' ? <OnboardingCreator /> : <OnboardingMedia />;
}
