'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  fuentes: string[];
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
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', color: '#EC4899' },
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#A855F7' },
  { key: 'x',         label: 'X',         icon: '✕',  color: '#60A5FA' },
  { key: 'facebook',  label: 'Facebook',  icon: '👥', color: '#34D399' },
];

const DECAY: Record<string, { label: string; color: string }> = {
  INMEDIATA: { label: 'Urgente — publicar hoy',  color: '#EC4899' },
  CORTA:     { label: 'Vigente 48h',             color: '#F59E0B' },
  NORMAL:    { label: 'Válido 1 semana',         color: '#A09EC0' },
  EVERGREEN: { label: 'Evergreen',               color: '#10B981' },
};

const FORMAT_MAP: Record<string, Record<string, string>> = {
  tiktok:    { INMEDIATA: 'Video 15–30s', CORTA: 'Video 30–60s', NORMAL: 'Video 45–60s', EVERGREEN: 'Serie de videos' },
  instagram: { INMEDIATA: 'Story + Reel', CORTA: 'Reel',         NORMAL: 'Carrusel',     EVERGREEN: 'Carrusel educativo' },
  x:         { INMEDIATA: 'Hilo rápido',  CORTA: 'Tweet',        NORMAL: 'Tweet + img',  EVERGREEN: 'Thread' },
  facebook:  { INMEDIATA: 'Post rápido',  CORTA: 'Post',         NORMAL: 'Video',        EVERGREEN: 'Álbum' },
};

function scoreColor(v: number) {
  if (v >= 70) return '#A855F7';
  if (v >= 55) return '#F59E0B';
  if (v >= 35) return '#F97316';
  return '#5C5A7A';
}

function topNetwork(idea: Idea) {
  return NETWORKS.reduce((best, net) => {
    const s = idea.scores?.[net.key]?.content || 0;
    const b = idea.scores?.[best.key]?.content || 0;
    return s > b ? net : best;
  }, NETWORKS[0]);
}

// ─── CopyBlock ────────────────────────────────────────────────────────────────

function CopyBlock({ text, hashtags }: { text: string; hashtags?: string[] }) {
  const [copied, setCopied] = useState(false);
  const full = hashtags?.length ? `${text}\n\n${hashtags.join(' ')}` : text;
  return (
    <div className="rounded-xl border p-4 relative"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-sm leading-relaxed pr-16" style={{ color: '#A09EC0' }}>{text}</p>
      {hashtags?.length ? (
        <p className="text-xs mt-2" style={{ color: '#7C3AED' }}>{hashtags.join(' ')}</p>
      ) : null}
      <button
        onClick={() => { navigator.clipboard.writeText(full); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg transition-all"
        style={{ color: copied ? '#10B981' : '#5C5A7A', background: 'rgba(255,255,255,0.06)' }}
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

// ─── Sección reutilizable ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#13112A' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#5C5A7A' }}>{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Página de detalle ────────────────────────────────────────────────────────

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('tiktok');
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then((data: Idea[]) => {
        const found = Array.isArray(data) ? data.find(a => a.id === id) : null;
        setIdea(found || null);
        if (found) {
          // Activar tab de la red con mayor score
          const top = NETWORKS.reduce((best, net) => {
            const s = found.scores?.[net.key]?.content || 0;
            const b = found.scores?.[best.key]?.content || 0;
            return s > b ? net : best;
          }, NETWORKS[0]);
          setActiveTab(top.key);
        }
        setLoading(false);
      });
  }, [id]);

  async function generateCaption(network: string) {
    if (!idea) return;
    setGenerating(`caption-${network}`);
    // Por ahora copia el copy existente si lo tiene
    const text = idea.copy?.[network];
    if (text) {
      const full = idea.hashtags?.[network]?.length
        ? `${text}\n\n${idea.hashtags[network].join(' ')}`
        : text;
      await navigator.clipboard.writeText(full);
    }
    setGenerating(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: '#5C5A7A' }}>Cargando brief...</p>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-white">Brief no encontrado</p>
        <Link href="/oportunidades" className="text-sm" style={{ color: '#7C3AED' }}>
          ← Volver a Oportunidades
        </Link>
      </div>
    );
  }

  const decay = DECAY[idea.decayType] || DECAY['NORMAL'];
  const topNet = topNetwork(idea);
  const topScore = idea.scores?.[topNet.key]?.content || 0;
  const date = new Date(idea.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()}
          className="text-xs transition-colors flex items-center gap-1"
          style={{ color: '#5C5A7A' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#A09EC0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#5C5A7A')}>
          ← Volver
        </button>
        <span style={{ color: '#3A3858' }}>/</span>
        <span className="text-xs" style={{ color: '#5C5A7A' }}>Brief</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl border p-6 mb-6"
        style={{ borderColor: 'rgba(124,58,237,0.25)', background: 'rgba(124,58,237,0.05)' }}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Badges de estado */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', color: decay.color, border: '1px solid rgba(255,255,255,0.08)' }}>
                ⏱ {decay.label}
              </span>
              {idea.sourceTrend && (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#5C5A7A', border: '1px solid rgba(255,255,255,0.06)' }}>
                  📡 {idea.sourceTrend}
                </span>
              )}
              <span className="text-xs" style={{ color: '#5C5A7A' }}>{date}</span>
            </div>

            <h1 className="text-2xl font-bold text-white leading-snug mb-3">{idea.title}</h1>

            {idea.angle && (
              <p className="text-base leading-relaxed" style={{ color: '#A09EC0' }}>
                <span style={{ color: '#7C3AED' }}>Ángulo → </span>{idea.angle}
              </p>
            )}
          </div>

          {/* Score destacado */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', minWidth: '80px' }}>
            <span className="text-3xl font-bold" style={{ color: scoreColor(topScore) }}>{topScore}</span>
            <span className="text-xs" style={{ color: '#5C5A7A' }}>score</span>
            <span className="text-xs font-medium" style={{ color: '#A855F7' }}>{topNet.icon} {topNet.label}</span>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                title:     idea.title,
                angle:     idea.angle || '',
                articleId: idea.id as string,
              });
              router.push(`/crear?${params.toString()}`);
            }}
            className="btn-primary text-sm px-4 py-2 rounded-xl"
            >
            ✦ Abrir en Content Studio
          </button>
          <button
            className="text-sm px-4 py-2 rounded-xl border transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.10)', color: '#A09EC0', background: 'rgba(255,255,255,0.03)' }}
            onClick={() => router.push('/calendario')}>
            📅 Pasar a calendario
          </button>
          <button
            onClick={() => generateCaption(activeTab)}
            disabled={!!generating}
            className="text-sm px-4 py-2 rounded-xl border transition-all disabled:opacity-50"
            style={{ borderColor: 'rgba(255,255,255,0.10)', color: '#A09EC0', background: 'rgba(255,255,255,0.03)' }}>
            {generating?.startsWith('caption') ? 'Copiando...' : '⎘ Copiar caption'}
          </button>
        </div>
      </div>

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-[1fr_360px] gap-6">
        {/* Columna izquierda */}
        <div className="space-y-5">

          {/* Por qué vale la pena */}
          {(idea.excerpt || idea.sourceTrend) && (
            <Section title="¿Por qué esta idea vale la pena?">
              <div className="space-y-3">
                {idea.excerpt && (
                  <p className="text-sm leading-relaxed" style={{ color: '#A09EC0' }}>{idea.excerpt}</p>
                )}
                {idea.sourceTrend && (
                  <div className="flex items-start gap-2.5 pt-2">
                    <span className="text-base flex-shrink-0">📡</span>
                    <div>
                      <p className="text-xs font-medium text-white mb-0.5">Señal detectada</p>
                      <p className="text-sm" style={{ color: '#A09EC0' }}>{idea.sourceTrend}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0">📊</span>
                  <div>
                    <p className="text-xs font-medium text-white mb-0.5">Vigencia</p>
                    <p className="text-sm" style={{ color: decay.color }}>{decay.label}</p>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Cómo abordarla */}
          {idea.brief && (
            <Section title="Cómo te conviene abordarla">
              <div className="space-y-4">
                {/* Gancho */}
                <div>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Gancho</p>
                  <p className="text-sm text-white leading-relaxed font-medium">{idea.brief.gancho}</p>
                </div>

                {/* Desarrollo */}
                {idea.brief.desarrollo?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#5C5A7A' }}>Desarrollo</p>
                    <div className="space-y-2.5">
                      {idea.brief.desarrollo.map((d, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7', marginTop: '1px' }}>
                            {i + 1}
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#A09EC0' }}>{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cierre */}
                {idea.brief.cierre && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5C5A7A' }}>Cierre</p>
                    <p className="text-sm" style={{ color: '#A09EC0' }}>{idea.brief.cierre}</p>
                  </div>
                )}

                {/* Formato + duración */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Formato</p>
                    <p className="text-sm font-medium text-white">
                      {idea.brief.formato || FORMAT_MAP[topNet.key]?.[idea.decayType] || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Duración</p>
                    <p className="text-sm font-medium text-white">{idea.brief.duracion || '—'}</p>
                  </div>
                </div>

                {/* Tip de producción */}
                {idea.brief.tip_produccion && (
                  <div className="rounded-xl p-4"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#A855F7' }}>💡 Tip de producción</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#A09EC0' }}>{idea.brief.tip_produccion}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Versiones por plataforma — tabs */}
          {idea.copy && (
            <Section title="Versiones sugeridas por plataforma">
              {/* Tabs */}
              <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {NETWORKS.map(net => {
                  const hasContent = !!idea.copy?.[net.key];
                  if (!hasContent) return null;
                  const score = idea.scores?.[net.key]?.content || 0;
                  return (
                    <button
                      key={net.key}
                      onClick={() => setActiveTab(net.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={activeTab === net.key
                        ? { background: 'rgba(124,58,237,0.25)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.4)' }
                        : { color: '#5C5A7A', border: '1px solid transparent' }}>
                      {net.icon} {net.label}
                      <span className="text-[10px] font-mono ml-0.5" style={{ color: scoreColor(score) }}>{score}</span>
                    </button>
                  );
                })}
              </div>

              {/* Contenido del tab activo */}
              {NETWORKS.map(net => {
                if (activeTab !== net.key) return null;
                const text = idea.copy?.[net.key];
                const tags = idea.hashtags?.[net.key];
                const s = idea.scores?.[net.key];
                const formato = FORMAT_MAP[net.key]?.[idea.decayType];
                if (!text) return null;
                return (
                  <div key={net.key} className="space-y-4">
                    {/* Meta de la red */}
                    <div className="flex items-center gap-4">
                      {formato && (
                        <span className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.04)', color: '#A09EC0', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {formato}
                        </span>
                      )}
                      {s?.recommendation?.label && (
                        <span className="text-xs" style={{ color: '#5C5A7A' }}>{s.recommendation.label}</span>
                      )}
                    </div>
                    <CopyBlock text={text} hashtags={tags} />
                  </div>
                );
              })}
            </Section>
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">
          {/* Score por canal */}
          <Section title="Score por canal">
            <div className="space-y-3">
              {NETWORKS.map(net => {
                const s = idea.scores?.[net.key];
                if (!s) return null;
                const val = s.content;
                const isTop = net.key === topNet.key;
                return (
                  <div key={net.key} className="rounded-xl p-3 transition-all"
                    style={{
                      background: isTop ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isTop ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white flex items-center gap-1.5">
                        {net.icon} {net.label}
                        {isTop && <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(124,58,237,0.2)', color: '#A855F7' }}>mejor opción</span>}
                      </span>
                      <span className="text-sm font-bold" style={{ color: scoreColor(val) }}>{val}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden mb-2"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: scoreColor(val) }} />
                    </div>
                    {s.recommendation?.detail && (
                      <p className="text-xs leading-relaxed" style={{ color: '#5C5A7A' }}>{s.recommendation.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Fuentes */}
          {(idea.brief?.fuentes?.length ?? 0) > 0 && (
            <Section title="Fuentes y referencias">
              <ul className="space-y-2">
                {idea.brief!.fuentes.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-xs mt-0.5" style={{ color: '#7C3AED' }}>·</span>
                    <p className="text-xs leading-relaxed" style={{ color: '#A09EC0' }}>{f}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Metadata */}
          <Section title="Información">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Categoría</p>
                <p className="text-sm text-white">{idea.category || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Generado</p>
                <p className="text-sm text-white">{date}</p>
              </div>
              {idea.sourceTrend && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#5C5A7A' }}>Señal de origen</p>
                  <p className="text-sm text-white">{idea.sourceTrend}</p>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
