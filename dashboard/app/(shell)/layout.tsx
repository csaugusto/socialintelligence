import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getClient } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import ShellHeader from '@/components/ShellHeader';

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role === 'superadmin') redirect('/admin');

  const client = await getClient(session.workspaceId);
  const workspaceName = client?.name || 'Mi workspace';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <ShellHeader
          workspaceId={session.workspaceId}
          workspaceName={workspaceName}
          role={session.role}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
