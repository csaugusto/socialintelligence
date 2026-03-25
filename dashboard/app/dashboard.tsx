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
  { key: 'instagram' as const, label: 'Instagram', short: 'IG', emoji: '📸' },
  { key: 'x' as const, label: 'X / Twitter', short: 'X', emoji: '𝕏' },
  { key: 'facebook' as const, label: 'Facebook', short: 'FB', emoji: '👥' },
  { key: 'tiktok' as const, label: 'TikTok', short: 'TK', emoji: '🎬' },
];

const RECOMMENDATION_STYLES: Record<string, string> = {
  AHORA:      'bg-green-900 text-green-300 border-green-800',
  PROGRAMAR:  'bg-blue-900 text-blue-300 border-blue-800',
  CONSIDERAR: 'bg-yellow-900 text-yellow-300 border-yellow-800',
  NO_APLICA:  'bg-gray-800 text-gray-500 border-gray-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  politica: 'Política', economia: 'Economía', seguridad: 'Seguridad',
  deportes: 'Deportes', entretenimiento: 'Entretenimiento', tecnologia: 'Tecnología',
  salud: 'Salud', cultura: 'Cultura', internacional: 'Internacional',
};

const DECAY_LABELS: Record<string, string> = {
  INMEDIATA: '🔴 Inmediata', CORTA: '🟠 Corta', NORMAL: '🟡 Normal', EVERGREEN: '🟢 Evergreen',
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
      <div className={`${color} h-1 rounded-full`} style={{ width: `${value}%` }} />
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 group relative">
      <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
      {hashtags?.length ? (
        <p className="text-xs text-blue-400 mt-1">{hashtags.join(' ')}</p>
      ) : null}
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded transition-colors"
      >
        {copied ? '✓ Copiado' : 'Copiar'}
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
          <h1 className="text-lg font-bold">Social Intelligence</h1>
          <p className="text-xs text-gray-500">Panel editorial</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/parrilla" className="text-xs text-gray-400 hover:text-white transition-colors">
            📅 Parrilla
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

      {/* Score legend */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-6 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Scores:</span>
        <span className="text-green-400">■ ≥70 Publicar</span>
        <span className="text-yellow-400">■ 55–69 Considerar</span>
        <span className="text-orange-400">■ 35–54 Esperar</span>
        <span className="text-gray-600">■ &lt;35 No publicar</span>
        <span className="ml-4 text-gray-600">Contenido = categoría + formato + caducidad · Momento = hora + día + disponibilidad</span>
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
  const [tab, setTab] = useState<'scores' | 'copy' | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showParrillaModal, setShowParrillaModal] = useState(false);

  const time = new Date(article.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(article.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  function toggleTab(t: 'scores' | 'copy') {
    setTab(prev => prev === t ? null : t);
  }

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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Row principal */}
      <div className="flex items-center gap-4 p-4">
        <div className={`w-2 self-stretch rounded-full flex-shrink-0 ${
          article.category === 'seguridad' ? 'bg-red-600' :
          article.category === 'politica' ? 'bg-blue-600' :
          article.category === 'economia' ? 'bg-yellow-600' :
          article.category === 'deportes' ? 'bg-green-600' :
          article.category === 'entretenimiento' ? 'bg-pink-600' :
          article.category === 'tecnologia' ? 'bg-cyan-600' :
          article.category === 'salud' ? 'bg-emerald-600' :
          article.category === 'cultura' ? 'bg-purple-600' :
          'bg-gray-600'
        }`} />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate">{article.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{date} {time}</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[article.category] || article.category}
            </span>
            <span className="text-xs text-gray-500">{DECAY_LABELS[article.decayType]}</span>
          </div>
        </div>

        {/* Scores compactos */}
        <div className="flex gap-3 flex-shrink-0">
          {NETWORKS.map(({ key, short }) => {
            const s = article.scores[key];
            return (
              <div key={key} className="text-center w-9">
                <p className="text-xs text-gray-500">{short}</p>
                <p className={`text-sm font-bold ${scoreColor(s.content)}`}>{s.content}</p>
              </div>
            );
          })}
        </div>

        {/* Botones */}
        <div className="flex gap-2 flex-shrink-0flex-wrap">
          <button onClick={() => toggleTab('scores')} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${tab === 'scores' ? 'bg-blue-900 border-blue-700 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
            Scores
          </button>
          <button onClick={() => toggleTab('copy')} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${tab === 'copy' ? 'bg-purple-900 border-purple-700 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
            Copy
          </button>
          <button onClick={reanalyze} disabled={reanalyzing} className="text-xs px-3 py-1.5 rounded-lg border bg-gray-800 border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 transition-colors">
            {reanalyzing ? '...' : '↻'}
          </button>
          <button onClick={() => setShowParrillaModal(true)} className="text-xs px-3 py-1.5 rounded-lg border bg-green-900 border-green-700 text-green-300 hover:bg-green-800 transition-colors">
            + Parrilla
          </button>
          {article.ghostUrl && (
            <a href={article.ghostUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border bg-gray-800 border-gray-700 text-gray-400 hover:text-white transition-colors">
              Ghost ↗
            </a>
          )}
        </div>
      </div>

      {/* Panel: Scores */}
      {tab === 'scores' && (
        <div className="border-t border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-3">
            Trend: <span className="text-gray-400">{article.sourceTrend}</span>
            {article.excerpt && <span className="ml-3 italic">{article.excerpt}</span>}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NETWORKS.map(({ key, label, emoji }) => {
              const s = article.scores[key];
              return (
                <div key={key} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-300 mb-3">{emoji} {label}</p>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-500">Contenido</span>
                        <span className={`font-bold ${scoreColor(s.content)}`}>{s.content}</span>
                      </div>
                      <ScoreBar value={s.content} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-500">Momento</span>
                        <span className={`font-bold ${scoreColor(s.moment)}`}>{s.moment}</span>
                      </div>
                      <ScoreBar value={s.moment} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-1">
                    <span className={`text-xs px-2 py-1 rounded border text-center font-medium ${RECOMMENDATION_STYLES[s.recommendation?.action] || RECOMMENDATION_STYLES.NO_APLICA}`}>
                      {s.recommendation?.label || '—'}
                    </span>
                    {s.recommendation?.detail && (
                      <span className="text-xs text-gray-600 text-center leading-tight">{s.recommendation.detail}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicación */}
          <div className="mt-3 text-xs text-gray-600 border-t border-gray-800 pt-3">
            <span className="font-medium text-gray-500">Cómo se calcula: </span>
            Contenido = categoría del tema × peso por red + bonus de formato (breaking/video) · Momento = hora del día + día de semana + disponibilidad de parrilla
          </div>
        </div>
      )}

      {/* Panel: Copy */}
      {tab === 'copy' && (
        <div className="border-t border-gray-800 p-4">
          {article.copy ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NETWORKS.map(({ key, label, emoji }) => (
                <div key={key}>
                  <p className="text-xs font-medium text-gray-400 mb-2">{emoji} {label}</p>
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
        <ParrillaModal article={article} onClose={() => setShowParrillaModal(false)} />
      )}
    </div>
  );
}

function ParrillaModal({ article, onClose }: { article: Article; onClose: () => void }) {
  const [network, setNetwork] = useState('instagram');
  const [scheduledFor, setScheduledFor] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);

  const netScore = article.scores[network as keyof typeof article.scores];
  const suggestedTime = netScore?.nextPeak?.label;

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
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <p className="text-sm text-gray-400 mb-4 truncate">{article.title}</p>

        {saved ? (
          <p className="text-center text-green-400 py-4">✓ Agregado a la parrilla</p>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Red social</label>
                <div className="grid grid-cols-2 gap-2">
                  {NETWORKS.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      onClick={() => setNetwork(key)}
                      className={`text-sm px-3 py-2 rounded-lg border transition-colors ${network === key ? 'bg-blue-900 border-blue-600 text-blue-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
                {suggestedTime && (
                  <p className="text-xs text-blue-400 mt-2">💡 Score sugiere: {suggestedTime}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Fecha y hora</label>
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
                <p className="text-red-300 text-xs font-medium">⚠️ Conflicto de horario</p>
                <p className="text-red-500 text-xs">Ya hay un post programado en {NETWORKS.find(n => n.key === network)?.label} a esa hora. Se guardó igual pero el alcance de ambos se verá afectado.</p>
                <button onClick={onClose} className="text-xs text-red-300 underline mt-1">Entendido, cerrar</button>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors">
                {saving ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
