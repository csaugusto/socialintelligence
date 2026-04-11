import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import OnboardingWizard from './wizard';

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <OnboardingWizard />;
}
