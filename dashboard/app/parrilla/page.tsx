import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ParrillaView from './parrilla';

export default async function ParrillaPage() {
  const authed = await getSession();
  if (!authed) redirect('/login');
  return <ParrillaView />;
}
