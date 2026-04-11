'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type NetworkScore = {
  content: number;
  moment: number;
  viable: boolean;
  urgency: string;
  recommendation: { action: string; label: string; detail: string };
};

type Brief = {
  formato: string;
  duracion: string;
  gancho: string;
  desarrollo: string[];
  cierre: string;
  tip_produccion: string;
};

type Idea = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  decayType: string;
  sourceTrend: string;
  angle?: string;
  brief?: Brief;
  scores: Record<string, NetworkScore>;
  copy?: Record<string, string>;
  hashtags?: Record<string, string[]>;
  createdAt: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const NETWORKS = [
  { key: 'tiktok',    label: 'TikTok',     icon: '🎵' },
  { key: 'instagram', label: 'Instagram',  icon: '📸' },
  { key: 'x',         label: 'X',          icon: '✕' },
  { key: 'facebook',  label: 'Facebook',   icon: '👥' },
];

const DECAY: Record<string, { label: string; color: string; urgency: number }> = {
  INMEDIATA: { label: 'Urgente',   color: '#EC4899', urgency: 4 },
  CORTA:     { label: '48h',       color: '#F59E0B', urgency: 3 },
  NORMAL:    { label: '1 semana',  color: '#A09EC0', urgency: 2 },
  EVERGREEN: { label: 'Evergreen', color: '#10B981', urgency: 1 },
};

const FORMAT_MAP: Record<string, Record<string, string>> = {
  tiktok:    { INMEDIATA: 'Video 15–30s', CORTA: 'Video 30–60s', NORMAL: 'Video 45–60s', EVERGREEN: 'Serie' },
  instagram: { INMEDIATA: 'Story + Reel', CORTA: 'Reel',         NORMAL: 'Carrusel',     EVERGREEN: 'Carrusel educativo' },
  x:         { INMEDIATA: 'Hilo rápido',  CORTA: 'Tweet',        NORMAL: 'Tweet + img',  EVERGREEN: 'Thread' },
  facebook:  { INMEDIATA: 'Post rápido',  CORTA: 'Post',         NORMAL: 'Video',        EVERGREEN: 'Álbum' },
};

type SortKey = 'score' | 'urgencia' | 'fecha';
type ViewMode = 'lista' | 'grid' | 'compacta';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topNet(idea: Idea) {
  return NETWORKS.reduce((best, net) => {
    const s = idea.scores?.[net.key]?.content || 0;
    const b = idea.scores?.[best.key]?.content || 0;
    return s > b ? net : best;
  }, NETWORKS[0]);
}

function topScore(idea: Idea) {
  return Math.max(...NETWORKS.map(n => idea.scores?.[n.key]?.content || 0));
}

function scoreColor(v: number) {
  if (v >= 70) return '#A855F7';
  if (v >= 55) return '#F59E0B';
  if (v >= 35) return '#F97316';
  return '#5C5A7A';
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ScorePill({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: scoreColor(value) }} />
      </div>
      <span className="text-xs font-mono" style={{ color: scoreColor(value) }}>{value}</span>
    </div>
  );
}

function BriefModal({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  const net = topNet(idea);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl border overflow-hidden max-h-[85vh] overflow-y-auto"
        style={{ background: '#13112A', borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Brief</p>
              <h2 className="text-lg font-semibold text-white leading-snug">{idea.title}</h2>
              {idea.angle && (
                <p className="text-sm mt-2" style={{ color: '#A09EC0' }}>
                  <span style={{ color: '#7C3AED' }}>Ángulo → </span>{idea.angle}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-xl leading-none flex-shrink-0 transition-colors"
              style={{ color: '#5C5A7A' }}>×</button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }}>
              {net.icon} {net.label}
            </span>
            {idea.brief?.formato && (
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#A09EC0', border: '1px solid rgba(255,255,255,0.06)' }}>
                {idea.brief.formato}
              </span>
            )}
            {idea.brief?.duracion && (
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#A09EC0', border: '1px solid rgba(255,255,255,0.06)' }}>
                ⏱ {idea.brief.duracion}
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full" style={{
              background: 'rgba(255,255,255,0.04)',
              color: DECAY[idea.decayType]?.color || '#A09EC0',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {DECAY[idea.decayType]?.label || idea.decayType}
            </span>
          </div>
        </div>

        {/* Contenido del brief */}
        {idea.brief && (
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Gancho</p>
              <p className="text-sm text-white leading-relaxed">{idea.brief.gancho}</p>
            </div>
            {idea.brief.desarrollo?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Desarrollo</p>
                <ul className="space-y-2">
                  {idea.brief.desarrollo.map((d, i) => (
                    <li key={i} className="text-sm flex gap-2.5" style={{ color: '#A09EC0' }}>
                      <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] mt-0.5"
                        style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>{i + 1}</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {idea.brief.cierre && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Cierre</p>
                <p className="text-sm" style={{ color: '#A09EC0' }}>{idea.brief.cierre}</p>
              </div>
            )}
            {idea.brief.tip_produccion && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#A855F7' }}>💡 Tip de producción</p>
                <p className="text-sm" style={{ color: '#A09EC0' }}>{idea.brief.tip_produccion}</p>
              </div>
            )}

            {/* Scores por red */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#5C5A7A' }}>Score por canal</p>
              <div className="grid grid-cols-2 gap-3">
                {NETWORKS.map(n => {
                  const s = idea.scores?.[n.key];
                  if (!s) return null;
                  return (
                    <div key={n.key} className="rounded-xl p-3 flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-lg">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white mb-1">{n.label}</p>
                        <ScorePill value={s.content} />
                        {s.recommendation?.label && (
                          <p className="text-[10px] mt-1" style={{ color: '#5C5A7A' }}>{s.recommendation.label}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Copy */}
            {idea.copy && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#5C5A7A' }}>Copy por canal</p>
                <div className="space-y-3">
                  {NETWORKS.map(n => {
                    const text = idea.copy?.[n.key];
                    const tags = idea.hashtags?.[n.key];
                    if (!text) return null;
                    return (
                      <CopyBlock key={n.key} label={`${n.icon} ${n.label}`} text={text} hashtags={tags} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyBlock({ label, text, hashtags }: { label: string; text: string; hashtags?: string[] }) {
  const [copied, setCopied] = useState(false);
  const full = hashtags?.length ? `${text}\n\n${hashtags.join(' ')}` : text;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: '#5C5A7A' }}>{label}</p>
      <div className="rounded-xl border p-3 relative" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <p className="text-sm leading-relaxed pr-14" style={{ color: '#A09EC0' }}>{text}</p>
        {hashtags?.length ? <p className="text-xs mt-1.5" style={{ color: '#7C3AED' }}>{hashtags.join(' ')}</p> : null}
        <button
          onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-lg transition-colors"
          style={{ color: copied ? '#10B981' : '#5C5A7A', background: 'rgba(255,255,255,0.05)' }}
        >
          {copied ? '✓' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

// ─── Idea cards por vista ──────────────────────────────────────────────────────

function CardLista({ idea, onOpenBrief, onDiscard, discarded }: {
  idea: Idea;
  onOpenBrief: () => void;

  onDiscard: () => void;
  discarded: boolean;
}) {
  const net = topNet(idea);
  const score = topScore(idea);
  const decay = DECAY[idea.decayType] || DECAY['NORMAL'];
  const formato = FORMAT_MAP[net.key]?.[idea.decayType] || '';

  return (
    <div className="rounded-2xl border p-4 flex items-start gap-4 transition-all"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: '#13112A',
        opacity: discarded ? 0.35 : 1,
      }}>
      {/* Score */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-bold leading-none" style={{ color: scoreColor(score) }}>{score}</span>
        <span className="text-[9px] mt-0.5" style={{ color: '#5C5A7A' }}>score</span>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug mb-1.5">{idea.title}</p>
        {idea.angle && (
          <p className="text-xs mb-2 leading-relaxed" style={{ color: '#A09EC0' }}>
            <span style={{ color: '#7C3AED' }}>→ </span>{idea.angle}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.25)' }}>
            {net.icon} {net.label}
          </span>
          {formato && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#A09EC0', border: '1px solid rgba(255,255,255,0.06)' }}>
              {formato}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', color: decay.color, border: '1px solid rgba(255,255,255,0.06)' }}>
            ⏱ {decay.label}
          </span>
          {idea.sourceTrend && (
            <span className="text-xs truncate max-w-[180px]" style={{ color: '#5C5A7A' }}>
              · {idea.sourceTrend}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {idea.brief && (
          <button onClick={onOpenBrief}
            className="text-xs px-3 py-1.5 rounded-xl border transition-all"
            style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }}>
            Ver brief
          </button>
        )}
        <button
          onClick={onDiscard}
          className="text-xs w-7 h-7 rounded-xl flex items-center justify-center border transition-all"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: discarded ? '#EF4444' : '#5C5A7A', background: 'rgba(255,255,255,0.03)' }}
          title={discarded ? 'Restaurar' : 'Descartar'}
        >
          {discarded ? '↩' : '×'}
        </button>
      </div>
    </div>
  );
}

function CardGrid({ idea, onOpenBrief, onDiscard, discarded }: {
  idea: Idea;
  onOpenBrief: () => void;

  onDiscard: () => void;
  discarded: boolean;
}) {
  const net = topNet(idea);
  const score = topScore(idea);
  const decay = DECAY[idea.decayType] || DECAY['NORMAL'];

  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-3 transition-all"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: '#13112A',
        opacity: discarded ? 0.35 : 1,
      }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', color: decay.color, border: '1px solid rgba(255,255,255,0.06)' }}>
          ⏱ {decay.label}
        </span>
        <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}</span>
      </div>

      <p className="text-sm font-semibold text-white leading-snug flex-1">{idea.title}</p>

      {idea.angle && (
        <p className="text-xs leading-relaxed" style={{ color: '#A09EC0' }}>
          <span style={{ color: '#7C3AED' }}>→ </span>{idea.angle}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.25)' }}>
          {net.icon} {net.label}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {idea.brief && (
          <button onClick={onOpenBrief}
            className="flex-1 text-xs py-1.5 rounded-xl border transition-all"
            style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.25)' }}>
            Ver brief
          </button>
        )}
        <button onClick={onDiscard}
          className="text-xs px-3 py-1.5 rounded-xl border transition-all"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: discarded ? '#EF4444' : '#5C5A7A', background: 'rgba(255,255,255,0.03)' }}>
          {discarded ? '↩' : '×'}
        </button>
      </div>
    </div>
  );
}

function CardCompacta({ idea, onOpenBrief, onDiscard, discarded }: {
  idea: Idea;
  onOpenBrief: () => void;

  onDiscard: () => void;
  discarded: boolean;
}) {
  const net = topNet(idea);
  const score = topScore(idea);
  const decay = DECAY[idea.decayType] || DECAY['NORMAL'];

  return (
    <div className="rounded-xl border px-3 py-2.5 flex items-center gap-3 transition-all"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background: '#13112A',
        opacity: discarded ? 0.35 : 1,
      }}>
      <span className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: scoreColor(score) }}>{score}</span>
      <span className="text-xs flex-shrink-0">{net.icon}</span>
      <p className="text-sm text-white flex-1 truncate">{idea.title}</p>
      <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded-full"
        style={{ color: decay.color, background: 'rgba(255,255,255,0.04)' }}>
        {decay.label}
      </span>
      {idea.brief && (
        <button onClick={onOpenBrief}
          className="text-xs flex-shrink-0 transition-colors"
          style={{ color: '#7C3AED' }}>
          Brief
        </button>
      )}
      <button onClick={onDiscard}
        className="text-xs flex-shrink-0 transition-colors"
        style={{ color: discarded ? '#EF4444' : '#5C5A7A' }}>
        {discarded ? '↩' : '×'}
      </button>
    </div>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function OportunidadesPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefIdea, setBriefIdea] = useState<Idea | null>(null);
  const [discarded, setDiscarded] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>('lista');
  const [sort, setSort] = useState<SortKey>('score');
  const [filterNet, setFilterNet] = useState<string>('');
  const [filterDecay, setFilterDecay] = useState<string>('');
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => { setIdeas(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  function toggleDiscard(id: string) {
    setDiscarded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = [...ideas];

    if (!showDiscarded) list = list.filter(i => !discarded.has(i.id));
    if (filterNet)   list = list.filter(i => (i.scores?.[filterNet]?.content || 0) > 0);
    if (filterDecay) list = list.filter(i => i.decayType === filterDecay);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.angle?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sort === 'score')    return topScore(b) - topScore(a);
      if (sort === 'urgencia') return (DECAY[b.decayType]?.urgency || 0) - (DECAY[a.decayType]?.urgency || 0);
      if (sort === 'fecha')    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return list;
  }, [ideas, discarded, showDiscarded, filterNet, filterDecay, search, sort]);

  const urgentesCount = ideas.filter(i => i.decayType === 'INMEDIATA' && !discarded.has(i.id)).length;

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar de filtros */}
      <aside className="w-52 flex-shrink-0 border-r p-4 space-y-6 overflow-y-auto"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0D0C1F' }}>

        {/* Resumen */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#5C5A7A' }}>Resumen</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: '#A09EC0' }}>Total</span>
              <span className="text-xs font-semibold text-white">{ideas.length}</span>
            </div>
            {urgentesCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#EC4899' }}>Urgentes</span>
                <span className="text-xs font-semibold" style={{ color: '#EC4899' }}>{urgentesCount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: '#A09EC0' }}>Con brief</span>
              <span className="text-xs font-semibold text-white">{ideas.filter(i => !!i.brief).length}</span>
            </div>
          </div>
        </div>

        {/* Ordenar */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Ordenar por</p>
          <div className="space-y-1">
            {([['score', 'Score'], ['urgencia', 'Urgencia'], ['fecha', 'Más reciente']] as [SortKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setSort(key)}
                className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
                style={sort === key
                  ? { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                  : { color: '#A09EC0', border: '1px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Canal */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Canal</p>
          <div className="space-y-1">
            <button onClick={() => setFilterNet('')}
              className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
              style={!filterNet
                ? { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                : { color: '#A09EC0', border: '1px solid transparent' }}>
              Todos
            </button>
            {NETWORKS.map(n => (
              <button key={n.key} onClick={() => setFilterNet(n.key === filterNet ? '' : n.key)}
                className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
                style={filterNet === n.key
                  ? { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                  : { color: '#A09EC0', border: '1px solid transparent' }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vigencia */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Vigencia</p>
          <div className="space-y-1">
            <button onClick={() => setFilterDecay('')}
              className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
              style={!filterDecay
                ? { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                : { color: '#A09EC0', border: '1px solid transparent' }}>
              Todas
            </button>
            {Object.entries(DECAY).map(([key, val]) => (
              <button key={key} onClick={() => setFilterDecay(key === filterDecay ? '' : key)}
                className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
                style={filterDecay === key
                  ? { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                  : { color: val.color, border: '1px solid transparent' }}>
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descartadas */}
        <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowDiscarded(v => !v)}
            className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
            style={showDiscarded
              ? { background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }
              : { color: '#5C5A7A', border: '1px solid transparent' }}>
            {showDiscarded ? 'Ocultar descartadas' : `Descartadas (${discarded.size})`}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b flex items-center gap-4 flex-wrap"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Oportunidades</h1>
            <p className="text-xs mt-0.5" style={{ color: '#5C5A7A' }}>
              {filtered.length} {filtered.length === 1 ? 'idea' : 'ideas'}
              {filterNet || filterDecay || search ? ' · filtradas' : ''}
            </p>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#5C5A7A' }}>
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ideas..."
              className="pl-8 pr-4 py-2 rounded-xl text-sm border focus:outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'white',
                width: '200px',
              }}
            />
          </div>

          {/* Vista */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {([['lista', '≡'], ['grid', '⊞'], ['compacta', '▤']] as [ViewMode, string][]).map(([key, icon]) => (
              <button key={key} onClick={() => setView(key)}
                className="w-8 h-7 rounded-lg text-sm flex items-center justify-center transition-all"
                style={view === key
                  ? { background: 'rgba(124,58,237,0.3)', color: '#A855F7' }
                  : { color: '#5C5A7A' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: '#5C5A7A' }}>Cargando ideas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <span className="text-xl">✦</span>
              </div>
              <p className="text-sm text-white">Sin ideas que mostrar</p>
              <p className="text-xs" style={{ color: '#5C5A7A' }}>
                {ideas.length === 0 ? 'Genera ideas desde la pantalla Inicio' : 'Prueba ajustando los filtros'}
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(idea => (
                <CardGrid
                  key={idea.id}
                  idea={idea}
                  onOpenBrief={() => router.push(`/briefs/${idea.id}`)}
                  onDiscard={() => toggleDiscard(idea.id)}
                  discarded={discarded.has(idea.id)}
                />
              ))}
            </div>
          ) : view === 'compacta' ? (
            <div className="space-y-1.5">
              {filtered.map(idea => (
                <CardCompacta
                  key={idea.id}
                  idea={idea}
                  onOpenBrief={() => router.push(`/briefs/${idea.id}`)}
                  onDiscard={() => toggleDiscard(idea.id)}
                  discarded={discarded.has(idea.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(idea => (
                <CardLista
                  key={idea.id}
                  idea={idea}
                  onOpenBrief={() => router.push(`/briefs/${idea.id}`)}
                  onDiscard={() => toggleDiscard(idea.id)}
                  discarded={discarded.has(idea.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de brief */}
      {briefIdea && <BriefModal idea={briefIdea} onClose={() => setBriefIdea(null)} />}
    </div>
  );
}
