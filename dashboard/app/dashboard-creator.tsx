'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type Recommendation = {
  action: 'AHORA' | 'PROGRAMAR' | 'CONSIDERAR' | 'NO_APLICA';
  label: string;
  detail: string;
};

type NetworkScore = {
  content: number;
  moment: number;
  viable: boolean;
  urgency: string;
  nextPeak: { hour: number; label: string };
  recommendation: Recommendation;
};

type Brief = {
  formato: string;
  duracion: string;
  gancho: string;
  desarrollo: string[];
  cierre: string;
  tip_produccion: string;
  fuentes: string[];
};

type TrendContext = {
  keyword: string;
  sources: string[];
  crossSource: boolean;
  trendScore: number;
};

type Idea = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  decayType: string;
  hasVideo?: boolean;
  sourceTrend: string;
  angle?: string;
  brief?: Brief;
  trendContext?: TrendContext;
  scores: {
    instagram: NetworkScore;
    x: NetworkScore;
    facebook: NetworkScore;
    tiktok: NetworkScore;
  };
  copy?: { instagram: string; x: string; facebook: string; tiktok: string };
  hashtags?: { instagram: string[]; x: string[]; facebook: string[]; tiktok: string[] };
  createdAt: string;
};

type Profile = {
  categories: string[];
  main_category: string;
  active_networks: string[];
  primary_network: string;
  produces_video: boolean;
  team_size: number;
  audience_age_range: string;
  editorial_schedule: { frequency?: string } | null;
  profile_narrative: string;
  objectives?: string[];
  content_pillars?: string[];
  tone?: string[];
  posting_frequency?: string;
  production_capacity?: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  username: string;
  connection_type: string;
};

type TrendTopic = {
  keyword: string;
  source: string;
  sources: string[];
  score: number;
  excerpt?: string;
  subreddit?: string;
  crossSource?: boolean;
  fit_score?: number;
  fit_reason?: string;
  angle_hint?: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const CREATOR_NETWORKS = [
  { key: 'tiktok' as const,    label: 'TikTok',      icon: '🎵' },
  { key: 'instagram' as const, label: 'Instagram',   icon: '📸' },
  { key: 'x' as const,         label: 'X',           icon: '✕' },
  { key: 'facebook' as const,  label: 'Facebook',    icon: '👥' },
];

const FORMAT_MAP: Record<string, Record<string, string>> = {
  tiktok:    { INMEDIATA: 'Video 15–30s', CORTA: 'Video 30–60s', NORMAL: 'Video 45–60s', EVERGREEN: 'Serie' },
  instagram: { INMEDIATA: 'Story + Reel', CORTA: 'Reel',         NORMAL: 'Carrusel',     EVERGREEN: 'Carrusel educativo' },
  x:         { INMEDIATA: 'Hilo rápido',  CORTA: 'Tweet',        NORMAL: 'Tweet + img',  EVERGREEN: 'Thread' },
  facebook:  { INMEDIATA: 'Post rápido',  CORTA: 'Post',         NORMAL: 'Video',        EVERGREEN: 'Álbum' },
};

const DECAY_LABEL: Record<string, { label: string; color: string }> = {
  INMEDIATA: { label: 'Urgente',   color: '#EC4899' },
  CORTA:     { label: '48h',       color: '#F59E0B' },
  NORMAL:    { label: '1 semana',  color: '#A09EC0' },
  EVERGREEN: { label: 'Evergreen', color: '#10B981' },
};

const ANALYSIS_STEPS = [
  'Conectando con YouTube MX, Reddit y Google Trends...',
  'Recopilando tendencias del momento...',
  'Cruzando con tu historial de contenido...',
  'Evaluando relevancia por nicho y voz...',
  'Filtrando los mejores matches para ti...',
  'Casi listo...',
];

const DEVELOPING_STEPS = [
  'Evaluando el ángulo para tu nicho...',
  'Construyendo el gancho perfecto...',
  'Desarrollando los puntos clave...',
  'Eligiendo el formato ideal...',
  'Generando copy para cada red...',
  'Puliendo el brief final...',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  if (v >= 70) return '#A855F7';
  if (v >= 55) return '#F59E0B';
  if (v >= 35) return '#F97316';
  return '#3A3858';
}

function topNetwork(idea: Idea) {
  const nets = CREATOR_NETWORKS.filter(n => idea.scores?.[n.key]);
  return nets.reduce((best, net) => {
    const s = idea.scores[net.key];
    const b = idea.scores[best.key];
    return (s?.content || 0) > (b?.content || 0) ? net : best;
  }, nets[0] || CREATOR_NETWORKS[0]);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function AnalyzingOverlay() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setStep(s => (s + 1) % ANALYSIS_STEPS.length); setVisible(true); }, 300);
    }, 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl border p-8 flex flex-col items-center gap-5 mb-6"
      style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.05)' }}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-1 rounded-full bg-purple-700/30 animate-pulse" />
        <span className="relative text-xl">✦</span>
      </div>
      <p className="text-sm text-purple-300 text-center transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }}>
        {ANALYSIS_STEPS[step]}
      </p>
      <div className="w-full max-w-xs h-px relative overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          style={{ animation: 'scan 1.8s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes scan { 0% { left: -33%; } 100% { left: 133%; } }`}</style>
    </div>
  );
}

function DevelopingOverlay({ keyword }: { keyword: string }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setStep(s => Math.min(s + 1, DEVELOPING_STEPS.length - 1)); setVisible(true); }, 300);
    }, 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl border p-8 flex flex-col items-center gap-4 mb-6"
      style={{ borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.07)' }}>
      <p className="text-xs uppercase tracking-widest" style={{ color: '#5C5A7A' }}>Desarrollando</p>
      <p className="text-base font-semibold text-white text-center">"{keyword}"</p>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-purple-600/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-3 rounded-full bg-purple-600/20 animate-pulse" />
        <span className="relative text-2xl" style={{ filter: 'drop-shadow(0 0 12px #a855f7)' }}>✦</span>
      </div>
      <p className="text-sm text-purple-200 text-center transition-opacity duration-300 min-h-[20px]"
        style={{ opacity: visible ? 1 : 0 }}>
        {DEVELOPING_STEPS[step]}
      </p>
      <div className="w-full max-w-xs h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full bg-gradient-to-r from-purple-700 via-purple-400 to-purple-700 transition-all duration-1000"
          style={{ width: `${Math.round(((step + 1) / DEVELOPING_STEPS.length) * 100)}%` }} />
      </div>
    </div>
  );
}

function CopyBlock({ text, hashtags }: { text: string; hashtags?: string[] }) {
  const [copied, setCopied] = useState(false);
  const full = hashtags?.length ? `${text}\n\n${hashtags.join(' ')}` : text;
  return (
    <div className="rounded-xl border p-3 relative" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-sm leading-relaxed pr-14" style={{ color: '#A09EC0' }}>{text}</p>
      {hashtags?.length ? <p className="text-xs mt-1" style={{ color: '#7C3AED' }}>{hashtags.join(' ')}</p> : null}
      <button
        onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-lg transition-colors"
        style={{ color: copied ? '#10B981' : '#5C5A7A', background: 'rgba(255,255,255,0.05)' }}
      >
        {copied ? '✓' : 'Copiar'}
      </button>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-1"
      style={{
        borderColor: accent ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)',
        background: accent ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
      }}>
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#5C5A7A' }}>{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs" style={{ color: '#5C5A7A' }}>{sub}</p>}
    </div>
  );
}

// ─── Idea Card (nueva) ────────────────────────────────────────────────────────

function IdeaCard({ idea, onRefresh }: { idea: Idea; onRefresh: () => void }) {
  const [showBrief, setShowBrief] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const topNet = topNetwork(idea);
  const topScore = idea.scores?.[topNet.key]?.content || 0;
  const decay = DECAY_LABEL[idea.decayType] || DECAY_LABEL['NORMAL'];
  const formato = FORMAT_MAP[topNet.key]?.[idea.decayType] || '';
  const time = new Date(idea.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  async function reanalyze() {
    setReanalyzing(true);
    await fetch('/api/articles/reanalyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idea.id }),
    });
    setReanalyzing(false);
    onRefresh();
  }

  return (
    <div id={`idea-${idea.id}`} className="rounded-2xl border overflow-hidden transition-all duration-150"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#13112A' }}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Score circle */}
          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-sm font-bold leading-none" style={{ color: scoreColor(topScore) }}>{topScore}</span>
            <span className="text-[9px] leading-none mt-0.5" style={{ color: '#5C5A7A' }}>score</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug mb-1.5">{idea.title}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Canal */}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }}>
                {topNet.icon} {topNet.label}
              </span>
              {/* Formato */}
              {formato && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#A09EC0', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {formato}
                </span>
              )}
              {/* Vigencia */}
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', color: decay.color, border: '1px solid rgba(255,255,255,0.06)' }}>
                ⏱ {decay.label}
              </span>
              <span className="text-xs ml-auto" style={{ color: '#5C5A7A' }}>{time}</span>
            </div>
          </div>
        </div>

        {/* Ángulo */}
        {idea.angle && (
          <p className="text-xs mt-3 leading-relaxed" style={{ color: '#A09EC0' }}>
            <span style={{ color: '#7C3AED' }}>Ángulo → </span>{idea.angle}
          </p>
        )}
      </div>

      {/* Scores de redes */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-2">
        {CREATOR_NETWORKS.map(net => {
          const s = idea.scores?.[net.key];
          if (!s) return null;
          const val = s.content || 0;
          return (
            <div key={net.key} className="flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: '#5C5A7A' }}>{net.icon}</span>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: scoreColor(val) }} />
              </div>
              <span className="text-[10px] font-mono" style={{ color: scoreColor(val) }}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        {idea.brief && (
          <button
            onClick={() => { setShowBrief(v => !v); setShowCopy(false); }}
            className="text-xs px-3 py-1.5 rounded-xl border transition-all"
            style={showBrief
              ? { background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.5)', color: '#A855F7' }
              : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#A09EC0' }}
          >
            Brief
          </button>
        )}
        {idea.copy && (
          <button
            onClick={() => { setShowCopy(v => !v); setShowBrief(false); }}
            className="text-xs px-3 py-1.5 rounded-xl border transition-all"
            style={showCopy
              ? { background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.5)', color: '#A855F7' }
              : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#A09EC0' }}
          >
            Copy
          </button>
        )}
        <button
          onClick={reanalyze}
          disabled={reanalyzing}
          className="text-xs px-3 py-1.5 rounded-xl border transition-all disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', color: '#5C5A7A' }}
        >
          {reanalyzing ? 'Analizando...' : '↻ Re-analizar'}
        </button>
      </div>

      {/* Brief expandido */}
      {showBrief && idea.brief && (
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: '#5C5A7A' }}>Gancho</p>
            <p className="text-sm text-white leading-relaxed">{idea.brief.gancho}</p>
          </div>
          {idea.brief.desarrollo?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: '#5C5A7A' }}>Desarrollo</p>
              <ul className="space-y-1">
                {idea.brief.desarrollo.map((d, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: '#A09EC0' }}>
                    <span style={{ color: '#7C3AED' }}>·</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Formato</p>
              <p className="text-sm" style={{ color: '#A09EC0' }}>{idea.brief.formato}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Duración</p>
              <p className="text-sm" style={{ color: '#A09EC0' }}>{idea.brief.duracion}</p>
            </div>
          </div>
          {idea.brief.tip_produccion && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p className="text-xs" style={{ color: '#A09EC0' }}>
                <span style={{ color: '#A855F7' }}>💡 Tip: </span>{idea.brief.tip_produccion}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Copy expandido */}
      {showCopy && idea.copy && (
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {CREATOR_NETWORKS.map(net => {
            const text = idea.copy?.[net.key];
            const tags = idea.hashtags?.[net.key];
            if (!text) return null;
            return (
              <div key={net.key}>
                <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: '#5C5A7A' }}>{net.icon} {net.label}</p>
                <CopyBlock text={text} hashtags={tags} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Trend Card ───────────────────────────────────────────────────────────────

function TrendCard({ topic, onDevelop, isDeveloping, isAlreadyDeveloped }: {
  topic: TrendTopic;
  onDevelop: () => void;
  isDeveloping: boolean;
  isAlreadyDeveloped: boolean;
}) {
  const sourceLabel = topic.source === 'youtube_trending' ? 'YouTube MX'
    : topic.source === 'reddit' ? `Reddit · r/${topic.subreddit || 'popular'}`
    : 'Google Trends MX';

  const sourceBg = topic.source === 'youtube_trending'
    ? { bg: 'rgba(239,68,68,0.1)', color: '#F87171', border: 'rgba(239,68,68,0.2)' }
    : topic.source === 'reddit'
    ? { bg: 'rgba(249,115,22,0.1)', color: '#FB923C', border: 'rgba(249,115,22,0.2)' }
    : { bg: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: 'rgba(59,130,246,0.2)' };

  return (
    <div className="rounded-2xl border p-4 flex items-start gap-4 transition-all"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#13112A' }}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <p className="text-sm font-semibold text-white">{topic.keyword}</p>
          {topic.crossSource && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }}>
              múltiples fuentes
            </span>
          )}
          {topic.fit_score !== undefined && (
            <span className="text-xs font-mono font-semibold"
              style={{ color: topic.fit_score >= 80 ? '#A855F7' : topic.fit_score >= 65 ? '#F59E0B' : '#5C5A7A' }}>
              {topic.fit_score}% match
            </span>
          )}
        </div>
        <span className="inline-flex text-xs px-2 py-0.5 rounded-full mb-2"
          style={{ background: sourceBg.bg, color: sourceBg.color, border: `1px solid ${sourceBg.border}` }}>
          {sourceLabel}
        </span>
        {topic.fit_reason && (
          <p className="text-xs leading-relaxed mb-0.5" style={{ color: '#A09EC0' }}>
            <span style={{ color: '#7C3AED' }}>Por qué te sirve: </span>{topic.fit_reason}
          </p>
        )}
        {topic.angle_hint && (
          <p className="text-xs italic" style={{ color: '#5C5A7A' }}>{topic.angle_hint}</p>
        )}
      </div>

      {isAlreadyDeveloped ? (
        <span className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
          ✓ Desarrollada
        </span>
      ) : (
        <button
          onClick={onDevelop}
          disabled={isDeveloping}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }}
        >
          {isDeveloping ? 'Desarrollando...' : 'Desarrollar →'}
        </button>
      )}
    </div>
  );
}

// ─── Dashboard principal ───────────────────────────────────────────────────────

export default function DashboardCreator({
  role, viewAsClientId, clientName, workspaceId, workspaceName,
}: {
  role?: string;
  viewAsClientId?: string | null;
  clientName?: string | null;
  workspaceId?: string;
  workspaceName?: string;
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trends, setTrends] = useState<TrendTopic[] | null>(null);
  const [developingId, setDevelopingId] = useState<string | null>(null);
  const [scrollToId, setScrollToId] = useState<string | null>(null);

  const qs = viewAsClientId ? `?clientId=${viewAsClientId}` : '';

  async function loadIdeas() {
    const res = await fetch(`/api/articles${qs}`);
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    setIdeas(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadProfile() {
    const res = await fetch(`/api/profile${qs}`);
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
    }
  }

  useEffect(() => {
    loadIdeas();
    loadProfile();
    const interval = setInterval(loadIdeas, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scrollToId) return;
    const el = document.getElementById(`idea-${scrollToId}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setScrollToId(null); }
  }, [scrollToId, ideas]);

  async function handleLoadTrends() {
    if (trends) { setTrends(null); return; }
    setLoadingTrends(true);
    const res = await fetch(`/api/creator/trends${qs}`);
    if (res.ok) {
      const data = await res.json();
      setTrends(Array.isArray(data) ? data : []);
    }
    setLoadingTrends(false);
  }

  async function handleDevelop(topic: TrendTopic) {
    setDevelopingId(topic.keyword);
    const res = await fetch('/api/creator/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (res.ok) {
      const newIdea = await res.json();
      setIdeas(prev => [newIdea, ...prev]);
      setTrends(prev => prev ? prev.filter(t => t.keyword !== topic.keyword) : prev);
      setScrollToId(newIdea.id);
    }
    setDevelopingId(null);
  }

  // KPIs
  const today = ideas.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString());
  const urgentes = ideas.filter(a => Object.values(a.scores).some(s => s.recommendation?.action === 'AHORA'));
  const conBrief = ideas.filter(a => !!a.brief);

  // Mezcla de contenido (decayType distribution)
  const mezcla = ideas.reduce<Record<string, number>>((acc, idea) => {
    acc[idea.decayType] = (acc[idea.decayType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto" style={{ color: '#A09EC0' }}>
      {/* Banner impersonación */}
      {viewAsClientId && clientName && (
        <div className="rounded-xl border px-4 py-2.5 mb-6 flex items-center justify-between"
          style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }}>
          <p className="text-xs" style={{ color: '#60A5FA' }}>
            <span className="font-semibold">Viendo como:</span> {clientName}
          </p>
        </div>
      )}

      {/* Saludo */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">
          {workspaceName ? `${workspaceName}` : 'Inicio'}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#5C5A7A' }}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <KPICard label="Ideas hoy" value={today.length} sub={`${ideas.length} en total`} />
        <KPICard label="Listas para publicar" value={urgentes.length} sub="Recomendación: AHORA" accent={urgentes.length > 0} />
        <KPICard label="Con brief generado" value={conBrief.length} sub="Listos para producir" />
      </div>

      {/* Módulo: Oportunidades del momento */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Lo que está pegando ahora</h2>
            <p className="text-xs mt-0.5" style={{ color: '#5C5A7A' }}>Tendencias filtradas por IA según tu nicho y voz</p>
          </div>
          <button
            onClick={handleLoadTrends}
            disabled={loadingTrends}
            className="text-xs px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50"
            style={trends
              ? { background: 'rgba(124,58,237,0.2)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.4)' }
              : { background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }}
          >
            {loadingTrends ? 'Analizando...' : trends ? 'Ocultar tendencias' : '✦ Ver tendencias'}
          </button>
        </div>

        {loadingTrends && <AnalyzingOverlay />}
        {developingId && <DevelopingOverlay keyword={developingId} />}

        {trends !== null && !loadingTrends && (
          trends.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-sm" style={{ color: '#5C5A7A' }}>Sin tendencias nuevas por el momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trends.map((topic, i) => (
                <TrendCard
                  key={i}
                  topic={topic}
                  onDevelop={() => handleDevelop(topic)}
                  isDeveloping={developingId === topic.keyword}
                  isAlreadyDeveloped={ideas.some(idea => idea.sourceTrend === topic.keyword)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Módulo: Qué publicar hoy */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Qué te conviene publicar hoy</h2>
            <p className="text-xs mt-0.5" style={{ color: '#5C5A7A' }}>Ideas ordenadas por score y vigencia</p>
          </div>
          <button
            onClick={loadIdeas}
            className="text-xs px-3 py-1.5 rounded-xl border transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#5C5A7A', background: 'rgba(255,255,255,0.02)' }}
          >
            ↻ Actualizar
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-sm" style={{ color: '#5C5A7A' }}>Cargando ideas...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <span className="text-2xl">✦</span>
            </div>
            <p className="text-base font-medium text-white mb-1">Sin ideas aún</p>
            <p className="text-sm" style={{ color: '#5C5A7A' }}>
              Presiona <span style={{ color: '#A855F7' }}>Ver tendencias</span> para explorar qué está pegando ahora
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onRefresh={loadIdeas} />
            ))}
          </div>
        )}
      </div>

      {/* Módulo: Mezcla de contenido */}
      {ideas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-white mb-4">Tu mezcla de contenido</h2>
          <div className="rounded-2xl border p-5 grid grid-cols-4 gap-4"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#13112A' }}>
            {Object.entries(DECAY_LABEL).map(([key, val]) => {
              const count = mezcla[key] || 0;
              const pct = ideas.length > 0 ? Math.round((count / ideas.length) * 100) : 0;
              return (
                <div key={key} className="flex flex-col items-center gap-2">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: val.color }} />
                  </div>
                  <p className="text-lg font-bold text-white">{count}</p>
                  <p className="text-xs text-center" style={{ color: val.color }}>{val.label}</p>
                  <p className="text-xs" style={{ color: '#5C5A7A' }}>{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
