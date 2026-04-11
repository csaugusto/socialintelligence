'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'gancho' | 'guion' | 'caption' | 'cta' | 'articulo' | 'seo' | 'variantes';

type TabMeta = {
  key: Tab;
  label: string;
  icon: string;
  placeholder: string;
  hint: string;
};

type RefinementAction = {
  label: string;
  icon: string;
  instruction: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS: TabMeta[] = [
  {
    key: 'gancho',
    label: 'Gancho',
    icon: '🪝',
    placeholder: 'Escribe o genera el gancho de apertura...\n\nEl gancho es la primera frase que captura la atención en los primeros 3 segundos.',
    hint: 'Primera frase que detiene el scroll',
  },
  {
    key: 'guion',
    label: 'Guion',
    icon: '🎬',
    placeholder: 'Escribe o genera el guion completo...\n\nEstructura: Gancho → Desarrollo → Cierre → CTA',
    hint: 'Guion completo con estructura narrativa',
  },
  {
    key: 'caption',
    label: 'Caption',
    icon: '✍️',
    placeholder: 'Escribe el caption para redes sociales...\n\nIncluye contexto, valor y llamada a la acción.',
    hint: 'Texto para el post en redes',
  },
  {
    key: 'cta',
    label: 'CTA',
    icon: '📣',
    placeholder: 'Escribe llamadas a la acción...\n\nEjemplos: "¿Te pasó algo así? Cuéntame en comentarios" / "Guarda este video si te fue útil"',
    hint: 'Llamadas a la acción al cierre',
  },
  {
    key: 'articulo',
    label: 'Artículo',
    icon: '📰',
    placeholder: 'Escribe el artículo completo...\n\nEstructura sugerida:\n# Título\n## Introducción\n## Desarrollo\n## Conclusión',
    hint: 'Versión larga para blog o newsletter',
  },
  {
    key: 'seo',
    label: 'SEO',
    icon: '🔍',
    placeholder: 'Optimización para buscadores...\n\nTítulo SEO:\nMeta descripción:\nPalabras clave:\nURL sugerida:',
    hint: 'Metadatos y palabras clave',
  },
  {
    key: 'variantes',
    label: 'Variantes',
    icon: '🔀',
    placeholder: 'Versiones alternativas del contenido...\n\nVariante A (más directa):\n\nVariante B (más emocional):\n\nVariante C (más polémica):',
    hint: 'Versiones alternativas del mismo ángulo',
  },
];

const REFINEMENTS: RefinementAction[] = [
  { label: 'Más corto',    icon: '✂️',  instruction: 'Acorta este contenido manteniendo el mensaje principal' },
  { label: 'Más viral',    icon: '🚀',  instruction: 'Hazlo más viral, con más gancho y emoción' },
  { label: 'Más experto',  icon: '🎓',  instruction: 'Dale un tono más experto y autorizado' },
  { label: 'Más emocional',icon: '❤️',  instruction: 'Hazlo más emocional y cercano' },
  { label: 'Más polémico', icon: '🔥',  instruction: 'Hazlo más controversial y que genere debate' },
  { label: 'Más simple',   icon: '💧',  instruction: 'Simplifica el lenguaje para que sea más accesible' },
];

const ALL_NETWORKS = [
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', maxChars: 2200 },
  { key: 'instagram', label: 'Instagram', icon: '📸', maxChars: 2200 },
  { key: 'x',         label: 'X',         icon: '✕',  maxChars: 280  },
  { key: 'youtube',   label: 'YouTube',   icon: '▶️', maxChars: 5000 },
  { key: 'facebook',  label: 'Facebook',  icon: '📘', maxChars: 63206 },
  { key: 'linkedin',  label: 'LinkedIn',  icon: '💼', maxChars: 3000 },
];

type StudioProfile = {
  workspaceName:   string;
  primaryNetwork:  string;
  activeNetworks:  string[];
  socialAccounts:  { platform: string; username: string }[];
  hasAiProfile:    boolean;
};


// ─── Editor de texto ──────────────────────────────────────────────────────────

function Editor({
  value,
  onChange,
  placeholder,
  minHeight = 320,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.max(minHeight, ref.current.scrollHeight) + 'px';
    }
  }, [value, minHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-none focus:outline-none text-sm leading-relaxed transition-colors"
      style={{
        background: 'transparent',
        color: value ? '#E2E0F0' : '#5C5A7A',
        minHeight,
        fontFamily: 'inherit',
      }}
    />
  );
}

// ─── Barra de herramientas del editor ─────────────────────────────────────────

function EditorToolbar({
  content,
  onGenerate,
  onRefine,
  onClear,
  generating,
  refining,
  activeTab,
  charLimit,
}: {
  content: string;
  onGenerate: () => void;
  onRefine: (action: RefinementAction) => void;
  onClear: () => void;
  generating: boolean;
  refining: string | null;
  activeTab: TabMeta;
  charLimit?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [showRefinements, setShowRefinements] = useState(false);
  const chars = content.length;

  function copy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Generar con IA */}
      <button
        onClick={onGenerate}
        disabled={generating}
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }}
      >
        {generating ? (
          <>
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.3"/>
              <path d="M6 2a4 4 0 0 1 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Generando...
          </>
        ) : (
          <>✦ Generar {activeTab.label}</>
        )}
      </button>

      {/* Refinamientos */}
      {content && (
        <div className="relative">
          <button
            onClick={() => setShowRefinements(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all"
            style={{
              borderColor: showRefinements ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)',
              color: showRefinements ? '#A855F7' : '#A09EC0',
              background: showRefinements ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
            }}
          >
            ✏️ Refinar
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ transform: showRefinements ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {showRefinements && (
            <div className="absolute left-0 top-full mt-1.5 rounded-2xl border overflow-hidden z-10 w-48"
              style={{ background: '#13112A', borderColor: 'rgba(255,255,255,0.1)' }}>
              {REFINEMENTS.map(r => (
                <button
                  key={r.label}
                  onClick={() => { onRefine(r); setShowRefinements(false); }}
                  disabled={!!refining}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left transition-all disabled:opacity-40"
                  style={{ color: '#A09EC0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#A09EC0'; }}
                >
                  <span>{r.icon}</span>
                  {refining === r.label ? 'Refinando...' : r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Copiar */}
      {content && (
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            color: copied ? '#10B981' : '#A09EC0',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {copied ? '✓ Copiado' : '⎘ Copiar'}
        </button>
      )}

      {/* Limpiar */}
      {content && (
        <button
          onClick={onClear}
          className="text-xs px-3 py-2 rounded-xl border transition-all ml-auto"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#5C5A7A', background: 'rgba(255,255,255,0.02)' }}
        >
          Limpiar
        </button>
      )}

      {/* Contador de caracteres */}
      {charLimit && (
        <span className="text-xs ml-auto" style={{ color: chars > charLimit ? '#EF4444' : '#5C5A7A' }}>
          {chars} / {charLimit}
        </span>
      )}
    </div>
  );
}

// ─── Panel de contexto (izquierda) ────────────────────────────────────────────

function ContextPanel({
  title,
  angle,
  network,
  activeNetworks,
  socialAccounts,
  onNetworkChange,
  onClearContext,
}: {
  title?: string;
  angle?: string;
  network: string;
  activeNetworks: string[];
  socialAccounts: { platform: string; username: string }[];
  onNetworkChange: (n: string) => void;
  onClearContext: () => void;
}) {
  // Mostrar solo las redes activas del creator, o todas si no hay perfil cargado
  const visibleNetworks = activeNetworks.length
    ? ALL_NETWORKS.filter(n => activeNetworks.includes(n.key))
    : ALL_NETWORKS.slice(0, 4);

  return (
    <aside className="w-64 flex-shrink-0 border-r overflow-y-auto"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0D0C1F' }}>

      <div className="p-4 space-y-5">
        {/* Contexto de la idea */}
        {title ? (
          <div>
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#5C5A7A' }}>Idea de origen</p>
            <div className="rounded-xl border p-3 space-y-2"
              style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.06)' }}>
              <p className="text-xs font-medium text-white leading-snug">{title}</p>
              {angle && (
                <p className="text-xs leading-relaxed" style={{ color: '#A09EC0' }}>
                  <span style={{ color: '#7C3AED' }}>→ </span>{angle}
                </p>
              )}
              <button
                onClick={onClearContext}
                className="text-xs transition-colors"
                style={{ color: '#5C5A7A' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#A09EC0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5C5A7A')}
              >
                × Quitar contexto
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Sin idea de origen</p>
            <p className="text-xs leading-relaxed" style={{ color: '#3A3858' }}>
              Abre un brief desde Oportunidades para tener contexto de IA
            </p>
          </div>
        )}

        {/* Cuentas conectadas */}
        {socialAccounts.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Tus cuentas</p>
            <div className="space-y-1">
              {socialAccounts.map(a => {
                const net = ALL_NETWORKS.find(n => n.key === a.platform);
                return (
                  <div key={a.platform}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>{net?.icon || '●'}</span>
                    <span style={{ color: '#A09EC0' }}>{a.username || a.platform}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Red objetivo */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Red objetivo</p>
          <div className="space-y-1">
            {visibleNetworks.map(n => (
              <button
                key={n.key}
                onClick={() => onNetworkChange(n.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all"
                style={network === n.key
                  ? { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                  : { color: '#A09EC0', border: '1px solid transparent' }}
              >
                <span>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                <span className="text-[10px]" style={{ color: '#3A3858' }}>{n.maxChars.toLocaleString()} chars</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guía por tab */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Consejos</p>
          <div className="space-y-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-medium text-white mb-1">Gancho</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5C5A7A' }}>Empieza con una pregunta, dato sorprendente o afirmación polémica</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-medium text-white mb-1">Regla 3-30-3</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5C5A7A' }}>3 segundos para enganchar, 30 para convencer, 3 minutos para retener</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function CrearPage() {
  const searchParams = useSearchParams();
  const briefTitle = searchParams.get('title') || '';
  const briefAngle = searchParams.get('angle') || '';

  const articleId = searchParams.get('articleId') || '';

  const [activeTab, setActiveTab]   = useState<Tab>('gancho');
  const [contents, setContents]     = useState<Record<Tab, string>>({
    gancho: '', guion: '', caption: '', cta: '', articulo: '', seo: '', variantes: '',
  });
  const [network, setNetwork]         = useState('instagram');
  const [title, setTitle]             = useState(briefTitle);
  const [generating, setGenerating]   = useState(false);
  const [refining, setRefining]       = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [contextTitle, setContextTitle] = useState(briefTitle);
  const [contextAngle]                = useState(briefAngle);
  const [wordCount, setWordCount]     = useState(0);
  const [studioProfile, setStudioProfile] = useState<StudioProfile | null>(null);

  // Cargar perfil + contenido guardado previamente
  useEffect(() => {
    fetch('/api/creator/studio')
      .then(r => r.json())
      .then((p: StudioProfile) => {
        if (p && !('error' in p)) {
          setStudioProfile(p);
          if (p.primaryNetwork) setNetwork(p.primaryNetwork);
        }
      })
      .catch(() => {});

    if (articleId) {
      fetch(`/api/creator/studio/save?articleId=${articleId}`)
        .then(r => r.json())
        .then((saved: { title?: string; network?: string; tabs?: Record<string, string> } | null) => {
          if (saved?.tabs) {
            setContents(prev => ({ ...prev, ...saved.tabs }));
            if (saved.network) setNetwork(saved.network);
            if (saved.title)   setTitle(saved.title);
          }
        })
        .catch(() => {});
    }
  }, [articleId]);

  const currentTab = TABS.find(t => t.key === activeTab)!;
  const currentNet = ALL_NETWORKS.find(n => n.key === network) || ALL_NETWORKS[1];
  const content    = contents[activeTab];

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [content]);

  function setContent(val: string) {
    setContents(prev => ({ ...prev, [activeTab]: val }));
  }

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const res  = await fetch('/api/creator/studio/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tab: activeTab, title, angle: contextAngle, network }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar');
      setContent(data.content);
    } catch (err) {
      console.error('[Studio]', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefine(action: RefinementAction) {
    if (!content) return;
    setRefining(action.label);
    try {
      const res  = await fetch('/api/creator/studio/refine', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content, instruction: action.instruction, network, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al refinar');
      setContent(data.content);
    } catch (err) {
      console.error('[Studio refine]', err);
    } finally {
      setRefining(null);
    }
  }

  async function handleSave() {
    if (!articleId) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/creator/studio/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ articleId, title, network, tabs: contents }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[Studio save]', err);
    } finally {
      setSaving(false);
    }
  }

  const filledTabs = Object.entries(contents).filter(([, v]) => v.trim()).length;

  return (
    <div className="flex h-full min-h-0">
      {/* Panel de contexto */}
      <ContextPanel
        title={contextTitle}
        angle={contextAngle}
        network={network}
        activeNetworks={studioProfile?.activeNetworks || []}
        socialAccounts={studioProfile?.socialAccounts || []}
        onNetworkChange={setNetwork}
        onClearContext={() => setContextTitle('')}
      />

      {/* Editor principal */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header del editor */}
        <div className="px-6 py-4 border-b flex items-start justify-between gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título de tu contenido..."
              className="w-full text-lg font-semibold bg-transparent focus:outline-none text-white placeholder-[#3A3858] mb-1"
            />
            <div className="flex items-center gap-3 text-xs" style={{ color: '#5C5A7A' }}>
              <span>{wordCount} palabras</span>
              <span>·</span>
              <span>{filledTabs} de {TABS.length} secciones</span>
              {content.length > 0 && currentNet.maxChars && (
                <>
                  <span>·</span>
                  <span style={{ color: content.length > currentNet.maxChars ? '#EF4444' : '#5C5A7A' }}>
                    {content.length}/{currentNet.maxChars} chars
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Acciones globales */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="text-xs px-3 py-2 rounded-xl border transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#A09EC0', background: 'rgba(255,255,255,0.03)' }}
            >
              📅 Programar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !articleId || filledTabs === 0}
              className="text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-40"
              style={{
                background: saved
                  ? 'rgba(16,185,129,0.2)'
                  : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                color: saved ? '#34D399' : 'white',
                border: saved ? '1px solid rgba(16,185,129,0.4)' : 'none',
              }}
            >
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-0 border-b overflow-x-auto"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => {
            const hasContent = !!contents[tab.key].trim();
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all"
                style={{
                  borderColor: isActive ? '#7C3AED' : 'transparent',
                  color: isActive ? '#A855F7' : hasContent ? '#A09EC0' : '#5C5A7A',
                }}
              >
                {tab.icon} {tab.label}
                {hasContent && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#7C3AED' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Área de escritura */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-5 pb-3">
            {/* Hint del tab */}
            <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: '#5C5A7A' }}>
              <span>{currentTab.icon}</span>
              {currentTab.hint}
            </p>

            {/* Editor */}
            <Editor
              value={content}
              onChange={setContent}
              placeholder={currentTab.placeholder}
              minHeight={360}
            />
          </div>

          {/* Toolbar */}
          <div className="sticky bottom-0 px-6 py-3 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0B0A1A' }}>
            <EditorToolbar
              content={content}
              onGenerate={handleGenerate}
              onRefine={handleRefine}
              onClear={() => setContent('')}
              generating={generating}
              refining={refining}
              activeTab={currentTab}
              charLimit={currentTab.key === 'caption' ? currentNet.maxChars : undefined}
            />
          </div>
        </div>
      </div>

      {/* Panel de preview (derecha) */}
      {content && (
        <aside className="w-72 flex-shrink-0 border-l overflow-y-auto"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0D0C1F' }}>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#5C5A7A' }}>
              Preview · {currentNet.icon} {currentNet.label}
            </p>

            {/* Simulación de post */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#13112A' }}>
              {/* Header fake de red social */}
              <div className="px-4 pt-4 pb-3 flex items-center gap-2.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                  {studioProfile?.workspaceName?.[0]?.toUpperCase() || '✦'}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">
                    {studioProfile?.socialAccounts?.find(a => a.platform === network)?.username
                      || studioProfile?.workspaceName
                      || 'Tu cuenta'}
                  </p>
                  <p className="text-[10px]" style={{ color: '#5C5A7A' }}>Ahora mismo</p>
                </div>
              </div>

              {/* Contenido del post */}
              <div className="px-4 py-3">
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#A09EC0' }}>
                  {content.length > 280 && network === 'x'
                    ? content.slice(0, 277) + '...'
                    : content.slice(0, 500) + (content.length > 500 ? '...' : '')}
                </p>
              </div>

              {/* Footer fake */}
              <div className="px-4 py-3 border-t flex items-center gap-4"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['❤️', '💬', '↗️', '🔖'].map((icon, i) => (
                  <button key={i} className="text-base opacity-40">{icon}</button>
                ))}
              </div>
            </div>

            {/* Stats del contenido */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#5C5A7A' }}>Palabras</span>
                <span className="text-xs font-medium text-white">{wordCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#5C5A7A' }}>Caracteres</span>
                <span className="text-xs font-medium" style={{
                  color: currentNet.maxChars && content.length > currentNet.maxChars ? '#EF4444' : 'white'
                }}>{content.length}</span>
              </div>
              {currentNet.maxChars && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: '#5C5A7A' }}>Límite {currentNet.label}</span>
                    <span className="text-xs" style={{ color: '#5C5A7A' }}>{currentNet.maxChars}</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (content.length / currentNet.maxChars) * 100)}%`,
                        background: content.length > currentNet.maxChars ? '#EF4444' : '#10B981',
                      }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
