'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

type Article = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  decayType: string;
  isBreaking?: boolean;
  hasVideo?: boolean;
  sourceTrend: string;
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
  ghostUrl: string | null;
  createdAt: string;
};

const NETWORKS = [
  { key: 'instagram' as const, label: 'Instagram', short: 'IG' },
  { key: 'x' as const, label: 'X / Twitter', short: 'X' },
  { key: 'facebook' as const, label: 'Facebook', short: 'FB' },
  { key: 'tiktok' as const, label: 'TikTok', short: 'TK' },
];

const RECOMMENDATION_STYLES: Record<string, string> = {
  AHORA:      'bg-green-900 text-green-300 border-green-700',
  PROGRAMAR:  'bg-blue-900 text-blue-300 border-blue-700',
  CONSIDERAR: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  NO_APLICA:  'bg-gray-800 text-gray-500 border-gray-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  politica: 'Política', economia: 'Economía', seguridad: 'Seguridad',
  deportes: 'Deportes', entretenimiento: 'Entretenimiento', tecnologia: 'Tecnología',
  salud: 'Salud', cultura: 'Cultura', internacional: 'Internacional',
};

const CATEGORY_COLOR: Record<string, string> = {
  seguridad: 'bg-red-600', politica: 'bg-blue-600', economia: 'bg-yellow-600',
  deportes: 'bg-green-600', entretenimiento: 'bg-pink-600', tecnologia: 'bg-cyan-600',
  salud: 'bg-emerald-600', cultura: 'bg-purple-600',
};

const DECAY_LABELS: Record<string, string> = {
  INMEDIATA: 'Inmediata', CORTA: 'Corta', NORMAL: 'Normal', EVERGREEN: 'Evergreen',
};

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400';
  if (score >= 55) return 'text-yellow-400';
  if (score >= 35) return 'text-orange-400';
  return 'text-gray-500';
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 55 ? 'bg-yellow-500' : value >= 35 ? 'bg-orange-500' : 'bg-gray-600';
  return (
    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
      <div className={`${color} h-1 rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

function getFormat(network: string, decayType: string, hasVideo?: boolean, isBreaking?: boolean): string {
  if (network === 'instagram') {
    if (hasVideo) return 'Reel';
    if (isBreaking) return 'Story + Post';
    if (decayType === 'EVERGREEN') return 'Carrusel';
    return 'Foto + Copy';
  }
  if (network === 'x') {
    if (isBreaking) return 'Hilo';
    if (hasVideo) return 'Tweet + Video';
    return 'Tweet + Imagen';
  }
  if (network === 'facebook') {
    if (hasVideo) return 'Video';
    if (decayType === 'EVERGREEN') return 'Álbum (3–5 slides)';
    return 'Post + Imagen';
  }
  if (network === 'tiktok') {
    if (decayType === 'INMEDIATA') return 'Video 15–30s';
    if (decayType === 'CORTA') return 'Video 30–60s';
    return 'Video 45–60s';
  }
  return '';
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
      {hashtags?.length ? (
        <p className="text-xs text-blue-400 mt-1">{hashtags.join(' ')}</p>
      ) : null}
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded transition-colors"
      >
        {copied ? '✓' : 'Copiar'}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadArticles() {
    const res = await fetch('/api/articles');
    if (res.status === 401) { router.push('/login'); return; }
    setArticles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadArticles();
    const interval = setInterval(loadArticles, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  const today = articles.filter(a =>
    new Date(a.createdAt).toDateString() === new Date().toDateString()
  );
  const toPublish = today.filter(a =>
    Object.values(a.scores).some(s => s.recommendation?.action === 'AHORA')
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Social Intelligence</h1>
          <p className="text-xs text-gray-500">Panel editorial</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/parrilla" className="text-xs text-gray-400 hover:text-white transition-colors">
            Parrilla
          </Link>
          <button onClick={loadArticles} className="text-xs text-gray-400 hover:text-white transition-colors">
            ↻ Actualizar
          </button>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white transition-colors">
            Salir
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Notas hoy</p>
          <p className="text-2xl font-bold">{today.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Listas para publicar</p>
          <p className="text-2xl font-bold text-green-400">{toPublish.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total en sistema</p>
          <p className="text-2xl font-bold">{articles.length}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2.5 border-b border-gray-800 flex items-center gap-5 text-xs text-gray-600">
        <span className="text-green-400">■ ≥70 Publicar</span>
        <span className="text-yellow-400">■ 55–69 Considerar</span>
        <span className="text-orange-400">■ 35–54 Esperar</span>
        <span>■ &lt;35 No publicar</span>
      </div>

      {/* Articles */}
      <main className="px-6 py-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">Sin notas aún</p>
            <p className="text-sm">Corre el pipeline para generar la primera nota</p>
            <code className="text-xs bg-gray-900 px-2 py-1 rounded mt-2 inline-block">node src/pipeline.js</code>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} onReanalyzed={loadArticles} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ArticleCard({ article, onReanalyzed }: { article: Article; onReanalyzed: () => void }) {
  const [showCopy, setShowCopy] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showParrillaModal, setShowParrillaModal] = useState(false);
  const [parrillaNetwork, setParrillaNetwork] = useState('instagram');

  const time = new Date(article.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(article.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  async function reanalyze() {
    setReanalyzing(true);
    await fetch('/api/articles/reanalyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article.id }),
    });
    setReanalyzing(false);
    onReanalyzed();
  }

  function openParrilla(network: string) {
    setParrillaNetwork(network);
    setShowParrillaModal(true);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 mt-0.5 ${CATEGORY_COLOR[article.category] || 'bg-gray-600'}`} />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{article.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{date} · {time}</span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-400">{CATEGORY_LABELS[article.category] || article.category}</span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{DECAY_LABELS[article.decayType]}</span>
            {article.sourceTrend && (
              <>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-600 italic truncate max-w-xs">{article.sourceTrend}</span>
              </>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={reanalyze}
            disabled={reanalyzing}
            className="text-xs px-2.5 py-1.5 rounded-lg border bg-gray-800 border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            {reanalyzing ? 'Analizando...' : '↻ Re-analizar'}
          </button>
          <button
            onClick={() => setShowCopy(v => !v)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${showCopy ? 'bg-purple-900 border-purple-700 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
          >
            Copy
          </button>
          {article.ghostUrl && (
            <a
              href={article.ghostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-lg border bg-gray-800 border-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              Ghost ↗
            </a>
          )}
        </div>
      </div>

      {/* Grid de redes — siempre visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-800">
        {NETWORKS.map(({ key, label }, i) => {
          const s = article.scores[key];
          const format = getFormat(key, article.decayType, article.hasVideo, article.isBreaking);
          const isLast = i === NETWORKS.length - 1;

          return (
            <div
              key={key}
              className={`p-3 flex flex-col gap-2 ${!isLast ? 'border-r border-gray-800' : ''} ${i >= 2 ? 'border-t border-gray-800 md:border-t-0' : ''}`}
            >
              {/* Nombre red */}
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>

              {/* Scores */}
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

              {/* Recomendación */}
              <div className={`text-xs px-2 py-1 rounded border text-center font-medium ${RECOMMENDATION_STYLES[s.recommendation?.action] || RECOMMENDATION_STYLES.NO_APLICA}`}>
                {s.recommendation?.label || '—'}
              </div>

              {/* Formato sugerido */}
              <p className="text-xs text-gray-600 text-center">{format}</p>

              {/* Acciones inline */}
              <button
                onClick={() => openParrilla(key)}
                className="mt-auto text-xs py-1 rounded border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-colors text-center w-full"
              >
                + Parrilla
              </button>
            </div>
          );
        })}
      </div>

      {/* Panel: Copy */}
      {showCopy && (
        <div className="border-t border-gray-800 p-4">
          {article.copy ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NETWORKS.map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{label}</p>
                  <CopyBlock
                    text={article.copy![key]}
                    hashtags={article.hashtags?.[key]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Esta nota fue generada antes de la actualización. Las nuevas notas incluirán copy.
            </p>
          )}
        </div>
      )}

      {/* Modal parrilla */}
      {showParrillaModal && (
        <ParrillaModal
          article={article}
          initialNetwork={parrillaNetwork}
          onClose={() => setShowParrillaModal(false)}
        />
      )}
    </div>
  );
}


function nowDateTime(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

function peakDateTime(hour: number): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(hour);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 16);
}

function ParrillaModal({ article, initialNetwork = 'instagram', onClose }: {
  article: Article;
  initialNetwork?: string;
  onClose: () => void;
}) {
  const [network, setNetwork] = useState(initialNetwork);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);

  const netScore = article.scores[network as keyof typeof article.scores];
  const suggestedTime = netScore?.nextPeak?.label;

  const [scheduledFor, setScheduledFor] = useState(() => {
    const s = article.scores[initialNetwork as keyof typeof article.scores];
    if (s?.recommendation?.action === 'AHORA') return nowDateTime();
    return s?.nextPeak?.hour != null ? peakDateTime(s.nextPeak.hour) : nowDateTime();
  });

  function changeNetwork(net: string) {
    setNetwork(net);
    setConflict(false);
    const s = article.scores[net as keyof typeof article.scores];
    if (s?.recommendation?.action === 'AHORA') {
      setScheduledFor(nowDateTime());
    } else if (s?.nextPeak?.hour != null) {
      setScheduledFor(peakDateTime(s.nextPeak.hour));
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/parrilla', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: article.id,
        articleTitle: article.title,
        network,
        scheduledFor: new Date(scheduledFor).toISOString(),
        copy: article.copy?.[network as keyof typeof article.copy] || null,
        hashtags: article.hashtags?.[network as keyof typeof article.hashtags] || [],
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.conflicts?.length > 0) {
      setConflict(true);
    } else {
      setSaved(true);
      setTimeout(onClose, 1200);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Agregar a parrilla</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <p className="text-sm text-gray-400 mb-4 truncate">{article.title}</p>

        {saved ? (
          <p className="text-center text-green-400 py-4">✓ Agregado a la parrilla</p>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Red social</label>
                <div className="grid grid-cols-2 gap-2">
                  {NETWORKS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => changeNetwork(key)}
                      className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                        network === key
                          ? 'bg-blue-900 border-blue-600 text-blue-200'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {suggestedTime && netScore?.recommendation?.action !== 'AHORA' && (
                  <p className="text-xs text-blue-400 mt-2">Score sugiere: {suggestedTime}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={e => { setScheduledFor(e.target.value); setConflict(false); }}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {conflict && (
              <div className="mt-3 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                <p className="text-red-300 text-xs font-medium">Conflicto de horario</p>
                <p className="text-red-500 text-xs mt-0.5">
                  Ya hay un post en {NETWORKS.find(n => n.key === network)?.label} a esa hora. Se guardó de todas formas pero el alcance de ambos se verá afectado.
                </p>
                <button onClick={onClose} className="text-xs text-red-300 underline mt-1">Entendido, cerrar</button>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={onClose}
                className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
              >
                {saving ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
