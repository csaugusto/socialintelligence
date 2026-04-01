'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  copy?: {
    instagram: string;
    x: string;
    facebook: string;
    tiktok: string;
  };
  hashtags?: {
    instagram: string[];
    x: string[];
    facebook: string[];
    tiktok: string[];
  };
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
};

type Client = {
  name: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  username: string;
  channel_id?: string;
  connection_type: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const CREATOR_NETWORKS = [
  { key: 'tiktok' as const,    label: 'TikTok',     short: 'TK' },
  { key: 'instagram' as const, label: 'Instagram',  short: 'IG' },
  { key: 'x' as const,         label: 'X / Twitter', short: 'X' },
  { key: 'facebook' as const,  label: 'Facebook',   short: 'FB' },
];

const RECOMMENDATION_STYLES: Record<string, string> = {
  AHORA:      'bg-purple-900 text-purple-300 border-purple-700',
  PROGRAMAR:  'bg-blue-900 text-blue-300 border-blue-700',
  CONSIDERAR: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  NO_APLICA:  'bg-gray-800 text-gray-500 border-gray-700',
};

const NICHO_LABELS: Record<string, string> = {
  lifestyle: 'Lifestyle', tecnologia: 'Tecnología', entretenimiento: 'Entretenimiento',
  educacion: 'Educación', fitness: 'Fitness / Salud', finanzas: 'Finanzas',
  gaming: 'Gaming', moda: 'Moda / Belleza', gastronomia: 'Gastronomía',
  viajes: 'Viajes', negocios: 'Negocios', otro: 'Otro',
};

const FORMAT_MAP: Record<string, Record<string, string>> = {
  tiktok:    { INMEDIATA: 'Video 15–30s', CORTA: 'Video 30–60s', NORMAL: 'Video 45–60s', EVERGREEN: 'Serie de videos' },
  instagram: { INMEDIATA: 'Story + Reel', CORTA: 'Reel', NORMAL: 'Carrusel', EVERGREEN: 'Carrusel educativo' },
  x:         { INMEDIATA: 'Hilo rápido', CORTA: 'Tweet', NORMAL: 'Tweet + imagen', EVERGREEN: 'Thread' },
  facebook:  { INMEDIATA: 'Post rápido', CORTA: 'Post', NORMAL: 'Video', EVERGREEN: 'Álbum' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  if (v >= 70) return 'text-purple-400';
  if (v >= 55) return 'text-yellow-400';
  if (v >= 35) return 'text-orange-400';
  return 'text-gray-500';
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-purple-500' : value >= 55 ? 'bg-yellow-500' : value >= 35 ? 'bg-orange-500' : 'bg-gray-600';
  return (
    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
      <div className={`${color} h-1 rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

function CopyBlock({ text, hashtags }: { text: string; hashtags?: string[] }) {
  const [copied, setCopied] = useState(false);
  const full = hashtags?.length ? `${text}\n\n${hashtags.join(' ')}` : text;
  function copy() {
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 relative">
      <p className="text-sm text-gray-200 leading-relaxed pr-14">{text}</p>
      {hashtags?.length ? <p className="text-xs text-purple-400 mt-1">{hashtags.join(' ')}</p> : null}
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded transition-colors"
      >
        {copied ? '✓' : 'Copiar'}
      </button>
    </div>
  );
}

// ─── Dashboard principal ───────────────────────────────────────────────────────

type TrendTopic = {
  keyword: string;
  source: string;
  sources: string[];
  score: number;
  excerpt?: string;
  channel?: string;
  subreddit?: string;
  crossSource?: boolean;
  // Matcher IA
  fit_score?: number;
  fit_reason?: string;
  angle_hint?: string;
};

const ANALYSIS_STEPS = [
  'Conectando con YouTube MX, Reddit y Google Trends...',
  'Recopilando tendencias del momento...',
  'Cruzando con tu historial de contenido...',
  'Evaluando relevancia por nicho y voz...',
  'Filtrando los mejores matches para ti...',
  'Casi listo...',
];

function AnalyzingOverlay() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStep(s => (s + 1) % ANALYSIS_STEPS.length);
        setVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-purple-900/40 bg-gray-950 px-6 py-8">
      <div className="max-w-md mx-auto flex flex-col items-center gap-5">
        {/* Orb animado */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-700/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-1 rounded-full bg-purple-800/30 animate-pulse" />
          <span className="relative text-2xl">✦</span>
        </div>

        {/* Mensaje ciclado */}
        <p
          className="text-sm text-purple-300 text-center transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {ANALYSIS_STEPS[step]}
        </p>

        {/* Barra de escaneo */}
        <div className="w-full h-px bg-gray-800 relative overflow-hidden rounded-full">
          <div
            className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
            style={{ animation: 'scan 1.8s ease-in-out infinite' }}
          />
        </div>

        {/* Steps completados */}
        <div className="flex gap-1.5">
          {ANALYSIS_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500' : 'bg-gray-700'}`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%   { left: -33%; }
          100% { left: 133%; }
        }
      `}</style>
    </div>
  );
}

const DEVELOPING_STEPS = [
  'Evaluando el ángulo para tu nicho...',
  'Construyendo el gancho perfecto...',
  'Desarrollando los puntos clave...',
  'Eligiendo el formato ideal...',
  'Generando copy para cada red...',
  'Añadiendo fuentes y referencias...',
  'Puliendo el brief final...',
];

function DevelopingOverlay({ keyword }: { keyword: string }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStep(s => Math.min(s + 1, DEVELOPING_STEPS.length - 1));
        setVisible(true);
      }, 300);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-purple-900/40 bg-gray-950 px-6 py-8">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-5">
        {/* Keyword siendo procesada */}
        <p className="text-xs text-gray-600 uppercase tracking-widest">Desarrollando</p>
        <p className="text-base font-semibold text-white text-center leading-snug">"{keyword}"</p>

        {/* Orb más dramático */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-600/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full bg-purple-700/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
          <div className="absolute inset-4 rounded-full bg-purple-600/20 animate-pulse" />
          <span className="relative text-3xl" style={{ filter: 'drop-shadow(0 0 12px #a855f7)' }}>✦</span>
        </div>

        {/* Mensaje ciclado */}
        <p
          className="text-sm text-purple-200 text-center transition-opacity duration-300 min-h-[20px]"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {DEVELOPING_STEPS[step]}
        </p>

        {/* Barra de progreso real */}
        <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-700 via-purple-400 to-purple-700 transition-all duration-1000 ease-out"
            style={{ width: `${Math.round(((step + 1) / DEVELOPING_STEPS.length) * 100)}%` }}
          />
        </div>

        {/* Scanline secundaria */}
        <div className="w-full h-px bg-gray-800/60 relative overflow-hidden rounded-full">
          <div
            className="absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent"
            style={{ animation: 'scan 1.4s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardCreator({ role }: { role?: string }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trends, setTrends] = useState<TrendTopic[] | null>(null);
  const [developingId, setDevelopingId] = useState<string | null>(null);
  const [scrollToId, setScrollToId] = useState<string | null>(null);

  async function loadIdeas() {
    const res = await fetch('/api/articles');
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    setIdeas(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadProfile() {
    const res = await fetch('/api/profile');
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setClient(data.client);
    }
  }

  async function loadAccounts() {
    const res = await fetch('/api/creator/accounts');
    if (res.ok) {
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    }
  }

  useEffect(() => {
    loadIdeas();
    loadProfile();
    loadAccounts();
    const interval = setInterval(loadIdeas, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scrollToId) return;
    const el = document.getElementById(`idea-${scrollToId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollToId(null);
    }
  }, [scrollToId, ideas]);

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  async function handleLoadTrends() {
    if (trends) { setTrends(null); return; } // toggle
    setLoadingTrends(true);
    const res = await fetch('/api/creator/trends');
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

  const today = ideas.filter(a =>
    new Date(a.createdAt).toDateString() === new Date().toDateString()
  );
  const listas = today.filter(a =>
    Object.values(a.scores).some(s => s.recommendation?.action === 'AHORA')
  );

  const nichoLabel = profile?.main_category ? (NICHO_LABELS[profile.main_category] || profile.main_category) : null;
  const frecuencia = profile?.editorial_schedule?.frequency || null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-purple-900/40 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Creator Intelligence</h1>
          <p className="text-xs text-purple-500">Panel de contenido</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/parrilla" className="text-xs text-gray-400 hover:text-white transition-colors">
            Calendario
          </Link>
          <Link href="/perfil" className="text-xs text-gray-400 hover:text-white transition-colors">
            Mi perfil
          </Link>
          {role === 'superadmin' && (
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white transition-colors">
              Admin
            </Link>
          )}
          <button
            onClick={handleLoadTrends}
            disabled={loadingTrends}
            className={`text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 text-white transition-colors font-medium ${trends ? 'bg-purple-900 border border-purple-600' : 'bg-purple-700 hover:bg-purple-600'}`}
          >
            {loadingTrends ? 'Analizando...' : trends ? '✦ Ocultar tendencias' : '✦ Ver tendencias'}
          </button>
          <button onClick={loadIdeas} className="text-xs text-gray-400 hover:text-white transition-colors">
            ↻ Actualizar
          </button>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white transition-colors">
            Salir
          </button>
        </div>
      </header>

      {/* Perfil strip */}
      {profile && (
        <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
          {client?.name && (
            <span className="text-sm font-semibold text-white mr-1">{client.name}</span>
          )}
          {nichoLabel && (
            <span className="text-xs bg-purple-900/60 text-purple-300 border border-purple-700 px-2.5 py-1 rounded-full font-medium">
              {nichoLabel}
            </span>
          )}
          {profile.categories?.filter(c => c !== profile.main_category).map(c => (
            <span key={c} className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2.5 py-1 rounded-full">
              {NICHO_LABELS[c] || c}
            </span>
          ))}
          {profile.active_networks?.map(n => {
            const acc = accounts.find(a => a.platform === n);
            const isPrimary = n === profile.primary_network;
            return (
              <span key={n} className={`inline-flex flex-col items-start text-xs px-2.5 py-1 rounded-lg border leading-tight ${isPrimary ? 'bg-purple-800/50 text-purple-300 border-purple-600' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                <span>{isPrimary ? `★ ${n}` : n}</span>
                {acc?.username && (
                  <span className={`text-[10px] ${isPrimary ? 'text-purple-400/70' : 'text-gray-600'}`}>
                    @{acc.username.replace(/^@/, '')}
                  </span>
                )}
              </span>
            );
          })}
          {frecuencia && (
            <span className="text-xs text-gray-600 ml-auto">{frecuencia}</span>
          )}
        </div>
      )}

      {/* Animación de análisis de tendencias */}
      {loadingTrends && <AnalyzingOverlay />}

      {/* Animación de brief en generación */}
      {developingId && <DevelopingOverlay keyword={developingId} />}

      {/* Panel de tendencias */}
      {trends !== null && (
        <div className="border-b border-purple-900/40 bg-gray-950">
          <div className="px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Tendencias relevantes para ti
              </p>
              <p className="text-xs text-gray-600 mt-0.5">Filtradas por IA según tu nicho y lo que te funciona</p>
            </div>
            <p className="text-xs text-gray-600">{trends.length} temas</p>
          </div>
          {trends.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-gray-500">Sin tendencias nuevas por el momento.</p>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {trends.map((topic, i) => {
                const isDeveloping = developingId === topic.keyword;
                const isAlreadyDeveloped = ideas.some(idea => idea.sourceTrend === topic.keyword);
                const sourceLabel = topic.source === 'youtube_trending'
                  ? 'YouTube MX'
                  : topic.source === 'reddit'
                  ? `Reddit · r/${(topic as TrendTopic & { subreddit?: string }).subreddit || 'popular'}`
                  : 'Google Trends MX';
                const sourceBadgeColor = topic.source === 'youtube_trending'
                  ? 'bg-red-950/50 text-red-400 border-red-800/50'
                  : topic.source === 'reddit'
                  ? 'bg-orange-950/50 text-orange-400 border-orange-800/50'
                  : 'bg-blue-950/50 text-blue-400 border-blue-800/50';

                return (
                  <div key={i} className="px-6 py-3 flex items-start gap-4 hover:bg-gray-900/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-white">{topic.keyword}</p>
                        {topic.crossSource && (
                          <span className="text-xs bg-yellow-900/40 text-yellow-500 border border-yellow-700/40 px-1.5 py-0.5 rounded-full">
                            múltiples fuentes
                          </span>
                        )}
                        {topic.fit_score !== undefined && (
                          <span className={`text-xs font-mono font-semibold ${topic.fit_score >= 80 ? 'text-purple-400' : topic.fit_score >= 65 ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {topic.fit_score}% match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs border px-1.5 py-0.5 rounded-full ${sourceBadgeColor}`}>
                          {sourceLabel}
                        </span>
                      </div>
                      {topic.fit_reason && (
                        <p className="text-xs text-purple-300/80 mb-0.5">
                          <span className="text-purple-500 font-medium">Por qué te sirve: </span>
                          {topic.fit_reason}
                        </p>
                      )}
                      {topic.angle_hint && (
                        <p className="text-xs text-gray-500 italic">{topic.angle_hint}</p>
                      )}
                    </div>
                    {isAlreadyDeveloped ? (
                      <span className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 border border-gray-700 whitespace-nowrap">
                        ✓ Desarrollada
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDevelop(topic)}
                        disabled={!!developingId}
                        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-700 disabled:opacity-40 text-white font-medium transition-colors whitespace-nowrap"
                      >
                        {isDeveloping ? 'Desarrollando...' : 'Desarrollar →'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Ideas hoy</p>
          <p className="text-2xl font-bold">{today.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Listas para publicar</p>
          <p className="text-2xl font-bold text-purple-400">{listas.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Total de ideas</p>
          <p className="text-2xl font-bold">{ideas.length}</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-6 py-2.5 border-b border-gray-800 flex items-center gap-5 text-xs text-gray-600">
        <span className="text-purple-400">■ ≥70 Publicar</span>
        <span className="text-yellow-400">■ 55–69 Considerar</span>
        <span className="text-orange-400">■ 35–54 Esperar</span>
        <span>■ &lt;35 No aplica</span>
      </div>

      {/* Ideas */}
      <main className="px-6 py-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando...</div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 border border-purple-800 mb-4">
              <span className="text-2xl">✦</span>
            </div>
            <p className="text-lg mb-1 text-gray-300">Sin ideas aún</p>
            <p className="text-sm text-gray-500">
              Presiona <span className="text-purple-400 font-medium">Ver tendencias</span> para explorar qué está pegando ahora
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} onRefresh={loadIdeas} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── IdeaCard ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onRefresh }: { idea: Idea; onRefresh: () => void }) {
  const [showCopy, setShowCopy] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const time = new Date(idea.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(idea.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  // Red con mayor score de contenido (solo redes presentes en scores)
  const availableNets = CREATOR_NETWORKS.filter(n => idea.scores?.[n.key]);
  const topNet = availableNets.reduce((best, net) => {
    const s = idea.scores[net.key];
    const b = idea.scores[best.key];
    return (s?.content || 0) > (b?.content || 0) ? net : best;
  }, availableNets[0] || CREATOR_NETWORKS[0]);

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
    <div id={`idea-${idea.id}`} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-1.5 self-stretch rounded-full flex-shrink-0 bg-purple-600" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{idea.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{date} · {time}</span>
            {idea.sourceTrend && (
              <>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-gray-600 italic truncate max-w-xs">{idea.sourceTrend}</span>
              </>
            )}
            <span className="text-xs bg-purple-900/40 text-purple-400 border border-purple-800/50 px-1.5 py-0.5 rounded">
              Mejor en {topNet.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={reanalyze}
            disabled={reanalyzing}
            className="text-xs px-2.5 py-1.5 rounded-lg border bg-gray-800 border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            {reanalyzing ? 'Analizando...' : '↻ Re-analizar'}
          </button>
          {idea.brief && (
            <button
              onClick={() => setShowBrief(v => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showBrief ? 'bg-purple-900 border-purple-700 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
            >
              Brief
            </button>
          )}
          <button
            onClick={() => setShowCopy(v => !v)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showCopy ? 'bg-purple-900 border-purple-700 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
          >
            Copy
          </button>
        </div>
      </div>

      {/* Contexto de tendencia */}
      {idea.trendContext && (
        <div className="px-4 pb-3 flex items-start gap-2 flex-wrap">
          <span className="text-xs text-gray-600">Tendencia detectada en:</span>
          {(idea.trendContext.sources || [idea.trendContext.keyword]).map((src, i) => (
            <span key={i} className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
              {src}
            </span>
          ))}
          {idea.trendContext.crossSource && (
            <span className="text-xs bg-yellow-900/40 border border-yellow-700/40 text-yellow-500 px-2 py-0.5 rounded-full">
              múltiples fuentes
            </span>
          )}
          {idea.trendContext.trendScore != null && (
            <span className="text-xs text-gray-600 ml-auto">score {idea.trendContext.trendScore}</span>
          )}
        </div>
      )}

      {/* Grid de redes — TikTok primero */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-800">
        {CREATOR_NETWORKS.filter(({ key }) => idea.scores?.[key]).map(({ key, label }, i, arr) => {
          const s = idea.scores[key];
          const fmt = FORMAT_MAP[key]?.[idea.decayType] || '';
          const isLast = i === arr.length - 1;

          return (
            <div
              key={key}
              className={`p-3 flex flex-col gap-2 ${!isLast ? 'border-r border-gray-800' : ''} ${i >= 2 ? 'border-t border-gray-800 md:border-t-0' : ''}`}
            >
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>

              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Contenido</span>
                    <span className={`font-bold ${scoreColor(s.content)}`}>{s.content}</span>
                  </div>
                  <ScoreBar value={s.content} />
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Momento</span>
                    <span className={`font-bold ${scoreColor(s.moment)}`}>{s.moment}</span>
                  </div>
                  <ScoreBar value={s.moment} />
                </div>
              </div>

              <div className={`text-xs px-2 py-1 rounded border text-center font-medium ${RECOMMENDATION_STYLES[s.recommendation?.action] || RECOMMENDATION_STYLES.NO_APLICA}`}>
                {s.recommendation?.label || '—'}
              </div>

              <p className="text-xs text-gray-600 text-center">{fmt}</p>
            </div>
          );
        })}
      </div>

      {/* Brief creativo */}
      {showBrief && idea.brief && (
        <div className="border-t border-purple-900/40 p-5 space-y-4 bg-gray-950/60">
          {/* Header del brief */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Brief creativo</p>
              <p className="text-sm font-medium text-white mt-0.5">
                {idea.brief.formato}
                {idea.brief.duracion && <span className="text-gray-500 font-normal"> · {idea.brief.duracion}</span>}
              </p>
            </div>
          </div>

          {idea.angle && (
            <div className="bg-purple-950/40 border border-purple-800/40 rounded-lg px-3 py-2">
              <p className="text-xs text-purple-400 font-medium mb-0.5">Ángulo</p>
              <p className="text-sm text-gray-200">{idea.angle}</p>
            </div>
          )}

          {/* Gancho */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1.5">Gancho de apertura</p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5">
              <p className="text-sm text-white font-medium leading-relaxed">"{idea.brief.gancho}"</p>
            </div>
          </div>

          {/* Desarrollo */}
          {idea.brief.desarrollo?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1.5">Qué cubrir</p>
              <ol className="space-y-1.5">
                {idea.brief.desarrollo.map((punto, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-300">
                    <span className="text-purple-500 font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{punto}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Cierre */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1.5">Cierre y CTA</p>
            <p className="text-sm text-gray-300">{idea.brief.cierre}</p>
          </div>

          {/* Tip de producción */}
          {idea.brief.tip_produccion && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
              <p className="text-xs text-yellow-500 font-medium mb-0.5">Tip de producción</p>
              <p className="text-sm text-gray-400">{idea.brief.tip_produccion}</p>
            </div>
          )}

          {/* Fuentes */}
          {idea.brief.fuentes?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1.5">Para documentarte</p>
              <ul className="space-y-1.5">
                {idea.brief.fuentes.map((f, i) => {
                  const query = encodeURIComponent(`${f} ${idea.sourceTrend}`);
                  const searchUrl = `https://www.google.com/search?q=${query}`;
                  return (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-gray-600 text-xs">→</span>
                    <a
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      {f}
                    </a>
                    <span className="text-xs text-gray-700">↗</span>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Copy */}
      {showCopy && (
        <div className="border-t border-gray-800 p-4">
          {idea.copy ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREATOR_NETWORKS.map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{label}</p>
                  <CopyBlock text={idea.copy![key]} hashtags={idea.hashtags?.[key]} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Esta idea fue generada antes de la actualización. Las nuevas incluirán copy.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
