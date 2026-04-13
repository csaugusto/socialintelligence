'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LightningIcon,
  FlameIcon,
  ChartLineUpIcon,
  UsersThreeIcon,
  ArrowRightIcon,
  SparkleIcon,
  MagnifyingGlassIcon,
  ArrowClockwiseIcon,
  CheckIcon,
} from '@phosphor-icons/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KpiConfig = {
  key: string;
  label: string;
  sublabel: string;
  color: 'purple' | 'blue' | 'green' | 'pink' | 'cyan';
  dataKey: string;
};

type Idea = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  decayType: string;
  scores: Record<string, { content: number; moment: number }>;
  createdAt: string;
  sourceTrend?: string;
};

type Trend = {
  keyword: string;
  source: string;
  score: number;
  fit_score?: number;
  fit_reason?: string;
  angle_hint?: string;
};

type GeneratingState = Record<string, 'idle' | 'loading' | 'done' | 'error'>;

type Props = {
  welcomeTitle: string;
  welcomeSubtitle: string;
  kpis: KpiConfig[];
  featuredModules: string[];
  emptyTitle: string;
  emptyBody: string;
  workspaceName: string;
};

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const KPI_COLORS: Record<string, { border: string; glow: string; value: string; badge: string }> = {
  purple: {
    border: 'rgba(124,58,237,0.3)',
    glow:   'rgba(124,58,237,0.08)',
    value:  '#A855F7',
    badge:  'rgba(124,58,237,0.15)',
  },
  blue: {
    border: 'rgba(59,130,246,0.3)',
    glow:   'rgba(59,130,246,0.06)',
    value:  '#60A5FA',
    badge:  'rgba(59,130,246,0.15)',
  },
  green: {
    border: 'rgba(16,185,129,0.3)',
    glow:   'rgba(16,185,129,0.06)',
    value:  '#34D399',
    badge:  'rgba(16,185,129,0.15)',
  },
  pink: {
    border: 'rgba(236,72,153,0.3)',
    glow:   'rgba(236,72,153,0.06)',
    value:  '#F472B6',
    badge:  'rgba(236,72,153,0.15)',
  },
  cyan: {
    border: 'rgba(6,182,212,0.3)',
    glow:   'rgba(6,182,212,0.06)',
    value:  '#22D3EE',
    badge:  'rgba(6,182,212,0.15)',
  },
};

const MODULE_CONFIG: Record<string, { label: string; href: string; description: string }> = {
  oportunidades: {
    label: 'Oportunidades',
    href: '/oportunidades',
    description: 'Ideas detectadas en tu nicho',
  },
  briefs:  { label: 'Briefs',        href: '/briefs',        description: 'Guiones y estructuras listos' },
  calendario: { label: 'Calendario', href: '/calendario',    description: 'Tu pipeline semanal' },
  estrategia: { label: 'Estrategia', href: '/estrategia',    description: 'Pilares, mix y competencia' },
  crear:   { label: 'Crear',         href: '/crear',         description: 'Content Studio' },
};

const DECAY_LABEL: Record<string, string> = {
  INMEDIATA: 'Urgente',
  CORTA:     'Esta semana',
  NORMAL:    'Vigente',
  EVERGREEN: 'Evergreen',
};

const DECAY_COLOR: Record<string, string> = {
  INMEDIATA: '#F472B6',
  CORTA:     '#FB923C',
  NORMAL:    '#A855F7',
  EVERGREEN: '#34D399',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({ kpi, value }: { kpi: KpiConfig; value: number | null }) {
  const c = KPI_COLORS[kpi.color];
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        border: `1px solid ${c.border}`,
        background: `linear-gradient(135deg, ${c.glow}, transparent)`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {kpi.label}
      </p>
      <p className="text-4xl font-bold leading-none" style={{ color: c.value }}>
        {value === null ? '—' : value}
      </p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {kpi.sublabel}
      </p>
    </div>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  const scoreValues = Object.values(idea.scores || {});
  const rawBest = scoreValues.length
    ? Math.max(...scoreValues.map(s => Math.round(((s.content || 0) + (s.moment || 0)) / 2)))
    : null;
  const bestScore = rawBest !== null && Number.isFinite(rawBest) ? rawBest : null;
  const decayColor = DECAY_COLOR[idea.decayType] || '#A855F7';
  const decayLabel = DECAY_LABEL[idea.decayType] || idea.decayType;

  return (
    <Link href={`/briefs/${idea.id}`}>
      <div
        className="rounded-xl p-4 transition-all duration-150"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.35)';
          (e.currentTarget as HTMLDivElement).style.background  = 'rgba(124,58,237,0.06)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLDivElement).style.background  = 'rgba(255,255,255,0.03)';
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm font-medium text-white leading-snug line-clamp-2">{idea.title}</p>
          <div
            className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}
          >
            {bestScore ?? '—'}
          </div>
        </div>
        <p className="text-xs line-clamp-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {idea.excerpt}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${decayColor}20`, color: decayColor }}
          >
            {decayLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HomeClient({
  welcomeTitle,
  welcomeSubtitle,
  kpis,
  featuredModules,
  emptyTitle,
  emptyBody,
}: Props) {
  const router = useRouter();
  const [ideas, setIdeas]           = useState<Idea[]>([]);
  const [loading, setLoading]       = useState(true);
  const [kpiValues, setKpiValues]   = useState<Record<string, number | null>>({});

  // Búsqueda de tendencias
  const [showTrends, setShowTrends]     = useState(false);
  const [trends, setTrends]             = useState<Trend[]>([]);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const [trendsError, setTrendsError]   = useState('');
  const [generating, setGenerating]     = useState<GeneratingState>({});

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then((data: Idea[]) => {
        const list = Array.isArray(data) ? data : [];
        setIdeas(list);
        computeKpis(list);
      })
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false));

    // Leer pipeline del localStorage para KPIs de producción
    try {
      const saved = localStorage.getItem('pipeline-items');
      if (saved) {
        const items: { status: string; scheduledDate?: string }[] = JSON.parse(saved);
        const inProd = items.filter(i =>
          ['brief_listo', 'en_creacion', 'revisando'].includes(i.status)
        ).length;
        const pubSemana = items.filter(i => {
          if (!['aprobada', 'programada', 'publicada'].includes(i.status)) return false;
          if (!i.scheduledDate) return true;
          const d = new Date(i.scheduledDate);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= weekAgo;
        }).length;
        setKpiValues(prev => ({ ...prev, en_produccion: inProd, publicados_semana: pubSemana }));
      }
    } catch { /* localStorage no disponible */ }
  }, []);

  async function fetchTrends() {
    setFetchingTrends(true);
    setTrendsError('');
    setShowTrends(true);
    try {
      const res = await fetch('/api/creator/trends');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al buscar tendencias');
      setTrends(Array.isArray(data) ? data : []);
    } catch (e) {
      setTrendsError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setFetchingTrends(false);
    }
  }

  async function generateBrief(trend: Trend) {
    const key = trend.keyword;
    setGenerating(prev => ({ ...prev, [key]: 'loading' }));
    try {
      const res = await fetch('/api/creator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar');
      setGenerating(prev => ({ ...prev, [key]: 'done' }));
      if (data.id) {
        setTimeout(() => router.push(`/briefs/${data.id}`), 400);
      }
    } catch {
      setGenerating(prev => ({ ...prev, [key]: 'error' }));
    }
  }

  function computeKpis(list: Idea[]) {
    const today = list.filter(a =>
      new Date(a.createdAt).toDateString() === new Date().toDateString()
    );
    const urgentes = list.filter(a => a.decayType === 'INMEDIATA' || a.decayType === 'CORTA');

    setKpiValues(prev => ({
      ...prev,
      ideas_hoy:        today.length,
      oportunidades:    urgentes.length,
      tendencias_nicho: list.length,
    }));
  }

  const topIdeas = ideas.slice(0, 4);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Bienvenida ─────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SparkleIcon size={16} weight="fill" color="#7C3AED" />
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#7C3AED' }}>
              {welcomeSubtitle}
            </p>
          </div>
          <h1 className="text-4xl font-bold text-white">{welcomeTitle}</h1>
        </div>

        <button
          onClick={fetchTrends}
          disabled={fetchingTrends}
          className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl"
        >
          {fetchingTrends
            ? <ArrowClockwiseIcon size={16} className="animate-spin" />
            : <MagnifyingGlassIcon size={16} />
          }
          {fetchingTrends ? 'Buscando...' : 'Buscar ideas'}
        </button>
      </div>

      {/* ── Panel de tendencias ────────────────────────────────────────── */}
      {showTrends && (
        <div className="mb-8 rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.04)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
            <div className="flex items-center gap-2">
              <LightningIcon size={16} weight="fill" color="#A855F7" />
              <p className="text-sm font-semibold text-white">Tendencias en tu nicho</p>
              {!fetchingTrends && trends.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>
                  {trends.length} encontradas
                </span>
              )}
            </div>
            <button onClick={() => setShowTrends(false)}
              className="text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Cerrar ×
            </button>
          </div>

          <div className="p-4">
            {fetchingTrends ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : trendsError ? (
              <p className="text-sm text-center py-4" style={{ color: '#EF4444' }}>{trendsError}</p>
            ) : trends.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No se encontraron tendencias en este momento. Intenta más tarde.
              </p>
            ) : (
              <div className="space-y-2">
                {trends.map((t) => {
                  const state = generating[t.keyword] || 'idle';
                  const alreadyGenerated = state === 'idle' && ideas.some(
                    a => a.sourceTrend && a.sourceTrend.toLowerCase() === t.keyword.toLowerCase()
                  );
                  const existingIdea = alreadyGenerated ? ideas.find(
                    a => a.sourceTrend && a.sourceTrend.toLowerCase() === t.keyword.toLowerCase()
                  ) : null;
                  return (
                    <div key={t.keyword}
                      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                      style={{
                        background: alreadyGenerated ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.03)',
                        border: alreadyGenerated ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.06)',
                        opacity: alreadyGenerated ? 0.6 : 1,
                      }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.keyword}</p>
                        {t.angle_hint && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#A09EC0' }}>
                            → {t.angle_hint}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {t.fit_score !== undefined && (
                          <span className="text-xs font-mono" style={{ color: '#7C3AED' }}>
                            fit {t.fit_score}
                          </span>
                        )}
                        {alreadyGenerated ? (
                          <a
                            href={`/briefs/${existingIdea?.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}
                          >
                            <CheckIcon size={12} />
                            Ver brief
                          </a>
                        ) : (
                          <button
                            onClick={() => generateBrief(t)}
                            disabled={state !== 'idle'}
                            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                            style={state === 'done'
                              ? { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' }
                              : state === 'error'
                              ? { background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }
                              : { background: 'rgba(124,58,237,0.15)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.3)' }
                            }
                          >
                            {state === 'loading' && <ArrowClockwiseIcon size={12} className="animate-spin" />}
                            {state === 'done'    && <CheckIcon size={12} />}
                            {state === 'idle'    && 'Generar brief'}
                            {state === 'loading' && 'Generando...'}
                            {state === 'done'    && 'Listo'}
                            {state === 'error'   && 'Reintentar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {kpis.map(kpi => (
          <KpiCard
            key={kpi.key}
            kpi={kpi}
            value={kpiValues[kpi.key] ?? null}
          />
        ))}
      </div>

      {/* ── Contenido principal ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ideas de hoy */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LightningIcon size={16} weight="fill" color="#A855F7" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Ideas detectadas
              </h2>
            </div>
            <Link
              href="/oportunidades"
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A855F7')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              Ver todas <ArrowRightIcon size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-xl h-24 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          ) : topIdeas.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <FlameIcon size={32} weight="light" color="#5C5A7A" className="mx-auto mb-3" />
              <p className="text-sm font-medium text-white/60 mb-1">{emptyTitle}</p>
              <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>{emptyBody}</p>
              <button
                onClick={fetchTrends}
                disabled={fetchingTrends}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
              >
                <MagnifyingGlassIcon size={14} />
                Buscar ideas ahora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {topIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho: módulos destacados */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ChartLineUpIcon size={16} weight="fill" color="#A855F7" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Ir a
            </h2>
          </div>

          <div className="space-y-2">
            {featuredModules.map(mod => {
              const m = MODULE_CONFIG[mod];
              if (!m) return null;
              return (
                <Link key={mod} href={m.href}>
                  <div
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-150"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.4)';
                      (e.currentTarget as HTMLDivElement).style.background  = 'rgba(124,58,237,0.08)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLDivElement).style.background  = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{m.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.description}</p>
                    </div>
                    <ArrowRightIcon size={14} color="rgba(255,255,255,0.2)" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* CTA secundario */}
          <div
            className="mt-4 rounded-xl p-4 text-center"
            style={{
              border: '1px solid rgba(124,58,237,0.2)',
              background: 'rgba(124,58,237,0.05)',
            }}
          >
            <UsersThreeIcon size={20} weight="light" color="#7C3AED" className="mx-auto mb-2" />
            <p className="text-xs font-medium text-white/60 mb-1">Competencia</p>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Monitorea a quién definiste en tu onboarding
            </p>
            <Link href="/estrategia">
              <button
                className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}
              >
                Ver estrategia
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
