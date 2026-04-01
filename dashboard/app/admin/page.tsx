import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminPanel from './admin';

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/');
  return <AdminPanel />;
}
