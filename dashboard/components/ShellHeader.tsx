'use client';

import { useRouter } from 'next/navigation';
import WorkspaceSwitcher from './WorkspaceSwitcher';

type Props = {
  workspaceId: string;
  workspaceName: string;
  role: string;
};

export default function ShellHeader({ workspaceId, workspaceName, role }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <header
      className="h-12 flex items-center justify-between px-5 border-b sticky top-0 z-20 backdrop-blur-md"
      style={{ background: 'rgba(5,8,22,0.75)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Workspace switcher */}
      <WorkspaceSwitcher
        currentWorkspaceId={workspaceId}
        currentWorkspaceName={workspaceName}
      />

      {/* Right */}
      <div className="flex items-center gap-3">
        {role === 'superadmin' && (
          <a href="/admin" className="text-xs px-2.5 py-1 rounded-lg border transition-all"
            style={{ color: '#A09EC0', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            Admin
          </a>
        )}
        <button
          onClick={handleLogout}
          className="text-xs transition-colors"
          style={{ color: '#5C5A7A' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#A09EC0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#5C5A7A')}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
