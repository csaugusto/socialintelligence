'use client';

import { useState, useEffect, useRef } from 'react';

type Workspace = {
  id: string;
  name: string;
  type: string;
  vertical: string;
  workspace_role: string;
  logo_url?: string;
};

const TYPE_ICONS: Record<string, string> = {
  creator:  '🎙️',
  brand:    '✨',
  company:  '🏢',
  media:    '📰',
  agency:   '🏛️',
};

const ROLE_LABELS: Record<string, string> = {
  owner:    'Propietario',
  editor:   'Editor',
  creator:  'Creador',
  analyst:  'Analista',
  viewer:   'Visor',
};

type Props = {
  currentWorkspaceId: string;
  currentWorkspaceName: string;
};

export default function WorkspaceSwitcher({ currentWorkspaceId, currentWorkspaceName }: Props) {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchWorkspaces() {
    setLoading(true);
    const res = await fetch('/api/workspaces');
    const json = await res.json();
    setWorkspaces(json.workspaces || []);
    setLoading(false);
  }

  function handleOpen() {
    if (!open) fetchWorkspaces();
    setOpen(o => !o);
    setCreating(false);
  }

  async function switchWorkspace(id: string) {
    if (id === currentWorkspaceId) { setOpen(false); return; }
    setSwitching(id);
    await fetch('/api/workspaces/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: id }),
    });
    // Hard reload para que los server components lean el nuevo JWT del cookie
    window.location.href = '/';
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    if (json.workspace) {
      await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: json.workspace.id }),
      });
      window.location.href = '/onboarding';
    }
    setLoading(false);
    setOpen(false);
    setNewName('');
  }

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5 transition-all group"
      >
        <span className="text-base leading-none">
          {TYPE_ICONS[currentWs?.type || 'creator'] ?? '✨'}
        </span>
        <span className="text-sm font-medium text-white/80 max-w-[140px] truncate">
          {currentWorkspaceName}
        </span>
        <svg
          className={`text-white/30 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          style={{ background: '#13111f' }}
        >
          {loading && !workspaces.length ? (
            <div className="px-4 py-6 text-center text-white/30 text-sm">Cargando...</div>
          ) : (
            <>
              <div className="px-3 pt-3 pb-2">
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider px-1 mb-2">Tus workspaces</p>
                <div className="space-y-0.5">
                  {workspaces.map(ws => {
                    const isCurrent = ws.id === currentWorkspaceId;
                    const isSwitching = switching === ws.id;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => switchWorkspace(ws.id)}
                        disabled={isSwitching}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          isCurrent
                            ? 'bg-purple-600/15 border border-purple-500/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className="text-lg">{TYPE_ICONS[ws.type] ?? '✨'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                            {ws.name}
                          </p>
                          <p className="text-xs text-white/30">{ROLE_LABELS[ws.workspace_role] ?? ws.workspace_role}</p>
                        </div>
                        {isCurrent && (
                          <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                        {isSwitching && (
                          <svg className="animate-spin text-white/40" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
                            <path d="M7 2a5 5 0 0 1 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/6 px-3 py-3">
                {creating ? (
                  <form onSubmit={handleCreate} className="space-y-2">
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Nombre del nuevo workspace"
                      className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 border border-white/10 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="flex-1 py-2 rounded-xl text-xs text-white/40 border border-white/8 hover:text-white/60 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newName.trim() || loading}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
                      >
                        {loading ? 'Creando...' : 'Crear'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Nuevo workspace
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
