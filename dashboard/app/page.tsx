import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Dashboard from './dashboard';

export default async function Home() {
  const authed = await getSession();
  if (!authed) redirect('/login');
  return <Dashboard />;
}
