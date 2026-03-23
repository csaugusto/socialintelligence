'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type NetworkScore = {
  content: number;
  moment: number;
  viable: boolean;
  urgency: string;
  recommendation: string;
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
  ghostUrl: string | null;
  image: { url: string } | null;
  createdAt: string;
};

const NETWORKS = [
  { key: 'instagram', label: 'IG', color: 'pink' },
  { key: 'x', label: 'X', color: 'sky' },
  { key: 'facebook', label: 'FB', color: 'blue' },
  { key: 'tiktok', label: 'TK', color: 'violet' },
] as const;

const RECOMMENDATION_STYLES: Record<string, string> = {
  PUBLICAR: 'bg-green-900 text-green-300 border-green-800',
  CONSIDERAR: 'bg-yellow-900 text-yellow-300 border-yellow-800',
  ESPERAR: 'bg-orange-900 text-orange-300 border-orange-800',
  NO_PUBLICAR: 'bg-gray-800 text-gray-500 border-gray-700',
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

export default function Dashboard() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadArticles() {
    const res = await fetch('/api/articles');
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    setArticles(data);
    setLoading(false);
  }

  useEffect(() => {
    loadArticles();
    const interval = setInterval(loadArticles, 60000); // refresh cada minuto
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
    Object.values(a.scores).some(s => s.recommendation === 'PUBLICAR')
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Social Intelligence</h1>
          <p className="text-xs text-gray-500">Panel editorial</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadArticles}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ↻ Actualizar
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
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
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const [open, setOpen] = useState(false);
  const time = new Date(article.createdAt).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });
  const date = new Date(article.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short',
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Row principal */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {/* Imagen miniatura */}
        {article.image ? (
          <img
            src={article.image.url}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-800 flex-shrink-0" />
        )}

        {/* Info */}
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
        <div className="flex gap-2 flex-shrink-0">
          {NETWORKS.map(({ key, label }) => {
            const s = article.scores[key as keyof typeof article.scores];
            return (
              <div key={key} className="text-center w-10">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-sm font-bold ${scoreColor(s.content)}`}>{s.content}</p>
              </div>
            );
          })}
        </div>

        <span className="text-gray-600 ml-2">{open ? '▲' : '▼'}</span>
      </div>

      {/* Detalle expandible */}
      {open && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-gray-400 italic">{article.excerpt}</p>
          )}

          {/* Trend source */}
          <p className="text-xs text-gray-600">
            Trend origen: <span className="text-gray-400">{article.sourceTrend}</span>
          </p>

          {/* Scores por red */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NETWORKS.map(({ key, label }) => {
              const s = article.scores[key as keyof typeof article.scores];
              return (
                <div key={key} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 mb-2">{label}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Contenido</span>
                      <span className={`font-bold ${scoreColor(s.content)}`}>{s.content}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Momento</span>
                      <span className={`font-bold ${scoreColor(s.moment)}`}>{s.moment}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${RECOMMENDATION_STYLES[s.recommendation] || RECOMMENDATION_STYLES.NO_PUBLICAR}`}>
                      {s.recommendation.replace('_', ' ')}
                    </span>
                  </div>
                  {!s.viable && (
                    <p className="text-xs text-gray-600 mt-1">No viable (tiempo)</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Link a Ghost */}
          {article.ghostUrl && (
            <a
              href={article.ghostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver nota en Ghost →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
