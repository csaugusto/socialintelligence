'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SlidersHorizontalIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
  FacebookLogoIcon,
  XLogoIcon,
  LinkedinLogoIcon,
  GlobeIcon,
  PencilSimpleIcon,
  EnvelopeSimpleIcon,
  CheckIcon,
  TrashIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Workspace = {
  id: string;
  name: string;
  type: string;
  vertical: string;
  workspace_role: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  username: string;
  connection_type: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKSPACE_TYPES = [
  { value: 'creator',  label: 'Creador de contenido' },
  { value: 'brand',    label: 'Marca personal' },
  { value: 'company',  label: 'Empresa / negocio' },
  { value: 'media',    label: 'Medio / blog' },
  { value: 'agency',   label: 'Agencia' },
];

type PlatformDef = {
  value: string;
  label: string;
  placeholder: string;
  prefix: string;
  Icon: PhosphorIcon;
  color: string;
};

const PLATFORMS: PlatformDef[] = [
  { value: 'instagram',  label: 'Instagram',  placeholder: 'tu_usuario',    prefix: '@',  Icon: InstagramLogoIcon, color: '#E1306C' },
  { value: 'tiktok',     label: 'TikTok',     placeholder: 'tu_usuario',    prefix: '@',  Icon: TiktokLogoIcon,    color: '#69C9D0' },
  { value: 'youtube',    label: 'YouTube',    placeholder: '@canal o URL',  prefix: '',   Icon: YoutubeLogoIcon,   color: '#FF0000' },
  { value: 'x',          label: 'X',          placeholder: 'tu_usuario',    prefix: '@',  Icon: XLogoIcon,         color: '#A09EC0' },
  { value: 'facebook',   label: 'Facebook',   placeholder: 'página o perfil', prefix: '', Icon: FacebookLogoIcon,  color: '#1877F2' },
  { value: 'linkedin',   label: 'LinkedIn',   placeholder: 'tu_usuario',    prefix: '',   Icon: LinkedinLogoIcon,  color: '#0A66C2' },
  { value: 'web',        label: 'Sitio web',  placeholder: 'tusitio.com',   prefix: '',   Icon: GlobeIcon,         color: '#A855F7' },
  { value: 'blog',       label: 'Blog',       placeholder: 'tublog.com',    prefix: '',   Icon: PencilSimpleIcon,  color: '#F59E0B' },
  { value: 'newsletter', label: 'Newsletter', placeholder: 'link o nombre', prefix: '',   Icon: EnvelopeSimpleIcon,color: '#10B981' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SaveButton({ saving, saved, onClick, disabled }: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5"
      style={saved
        ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
        : { background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }
      }
    >
      {saved
        ? <><CheckIcon size={14} weight="bold" /> Guardado</>
        : saving ? 'Guardando...' : 'Guardar'
      }
    </button>
  );
}

// ─── Section: Workspace ───────────────────────────────────────────────────────

function WorkspaceSection({ workspace }: { workspace: Workspace | null }) {
  const router = useRouter();
  const [name, setName] = useState(workspace?.name || '');
  const [type, setType] = useState(workspace?.type || 'creator');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setType(workspace.type);
    }
  }, [workspace]);

  const isDirty = workspace && (name !== workspace.name || type !== workspace.type);

  async function save() {
    if (!isDirty) return;
    setSaving(true);
    try {
      await fetch('/api/workspaces/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-white mb-0.5">Workspace</h2>
        <p className="text-sm" style={{ color: '#5C5A7A' }}>Información de tu marca, canal o empresa</p>
      </div>

      <div className="space-y-4 max-w-md">
        {/* Nombre */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: '#A09EC0' }}>Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setSaved(false); }}
            placeholder="Nombre del workspace"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 bg-white/4 focus:outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: '#A09EC0' }}>Tipo de cuenta</label>
          <div className="grid grid-cols-2 gap-2">
            {WORKSPACE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => { setType(t.value); setSaved(false); }}
                className="text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
                style={type === t.value
                  ? { borderColor: 'rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.1)', color: 'white' }
                  : { borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', color: '#5C5A7A' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rol actual */}
        {workspace?.workspace_role && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs" style={{ color: '#5C5A7A' }}>Tu rol:</span>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.2)' }}>
              {workspace.workspace_role}
            </span>
          </div>
        )}

        <div className="pt-2">
          <SaveButton saving={saving} saved={saved} onClick={save} disabled={!isDirty} />
        </div>
      </div>

      {/* Recalibrar perfil de IA */}
      <div className="mt-10 pt-8 border-t max-w-md" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Perfil de contenido</p>
            <p className="text-xs leading-relaxed" style={{ color: '#5C5A7A' }}>
              Actualiza tu nicho, objetivos, tono y ritmo. La IA usará esta información para personalizar todas tus recomendaciones.
            </p>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: 'rgba(124,58,237,0.1)',
              color: '#A855F7',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.18)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.25)';
            }}
          >
            <SlidersHorizontalIcon size={15} weight="light" />
            Recalibrar perfil
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Redes sociales ──────────────────────────────────────────────────

function SocialSection({ accounts, onRefresh }: {
  accounts: SocialAccount[];
  onRefresh: () => void;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const connected: Record<string, SocialAccount> = {};
  accounts.forEach(a => { connected[a.platform] = a; });

  function setInput(platform: string, value: string) {
    setInputs(prev => ({ ...prev, [platform]: value }));
    setSaved(null);
  }

  async function connect(platform: string) {
    const username = inputs[platform]?.trim();
    if (!username) return;
    setSaving(platform);
    try {
      await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, username }),
      });
      setSaved(platform);
      setInputs(prev => ({ ...prev, [platform]: '' }));
      onRefresh();
      setTimeout(() => setSaved(null), 2500);
    } finally {
      setSaving(null);
    }
  }

  async function disconnect(platform: string) {
    setDeleting(platform);
    try {
      await fetch(`/api/social-accounts/${platform}`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-white mb-0.5">Redes sociales</h2>
        <p className="text-sm" style={{ color: '#5C5A7A' }}>
          Agrega tus cuentas para que el sistema personalice mejor tus recomendaciones
        </p>
      </div>

      <div className="space-y-3 max-w-lg">
        {PLATFORMS.map(p => {
          const account = connected[p.value];
          const isConnected = !!account;
          const isSaving = saving === p.value;
          const isSaved = saved === p.value;
          const isDeleting = deleting === p.value;

          return (
            <div key={p.value}
              className="rounded-2xl border p-4 transition-all"
              style={{
                borderColor: isConnected ? `${p.color}25` : 'rgba(255,255,255,0.06)',
                background: isConnected ? `${p.color}06` : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                  <p.Icon size={18} weight="light" color={p.color} />
                </div>

                {/* Label + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{p.label}</span>
                    {isConnected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        Conectado
                      </span>
                    )}
                  </div>

                  {isConnected ? (
                    <p className="text-xs" style={{ color: '#A09EC0' }}>
                      {p.prefix}{account.username}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center flex-1 rounded-xl border border-white/8 bg-white/4 overflow-hidden">
                        {p.prefix && (
                          <span className="pl-3 text-sm" style={{ color: '#5C5A7A' }}>{p.prefix}</span>
                        )}
                        <input
                          type="text"
                          value={inputs[p.value] || ''}
                          onChange={e => setInput(p.value, e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && connect(p.value)}
                          placeholder={p.placeholder}
                          className="flex-1 px-3 py-2 text-sm text-white placeholder-white/25 bg-transparent focus:outline-none"
                          style={{ paddingLeft: p.prefix ? '4px' : '12px' }}
                        />
                      </div>
                      <button
                        onClick={() => connect(p.value)}
                        disabled={!inputs[p.value]?.trim() || isSaving}
                        className="px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 whitespace-nowrap"
                        style={isSaved
                          ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
                          : { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                        }
                      >
                        {isSaving ? '...' : isSaved ? '✓' : 'Conectar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Disconnect */}
                {isConnected && (
                  <button
                    onClick={() => disconnect(p.value)}
                    disabled={isDeleting}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-40 hover:opacity-100"
                    style={{ color: '#EC4899' }}
                    title="Desconectar"
                  >
                    {isDeleting
                      ? <span className="text-[10px]">...</span>
                      : <TrashIcon size={14} weight="light" />
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<'workspace' | 'redes'>('workspace');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [wsRes, socialRes] = await Promise.all([
      fetch('/api/workspaces/current').then(r => r.json()),
      fetch('/api/social-accounts').then(r => r.json()),
    ]);
    if (wsRes.workspace) setWorkspace(wsRes.workspace);
    if (Array.isArray(socialRes.accounts)) setAccounts(socialRes.accounts);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Configuración</h1>
        <p className="text-sm mt-0.5" style={{ color: '#5C5A7A' }}>
          {workspace?.name || '—'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { key: 'workspace', label: 'Workspace' },
          { key: 'redes',     label: 'Redes sociales' },
        ] as const).map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key
              ? { background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }
              : { color: '#5C5A7A' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm" style={{ color: '#5C5A7A' }}>Cargando...</p>
        </div>
      ) : (
        <>
          {tab === 'workspace' && <WorkspaceSection workspace={workspace} />}
          {tab === 'redes'     && <SocialSection accounts={accounts} onRefresh={loadData} />}
        </>
      )}
    </div>
  );
}
