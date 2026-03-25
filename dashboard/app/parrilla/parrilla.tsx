'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ParrillaItem = {
  id: string;
  articleId: string;
  articleTitle: string;
  network: string;
  scheduledFor: string;
  copy: string | null;
  hashtags: string[];
  conflicts: string[];
};

const NETWORKS = [
  { key: 'instagram', label: 'Instagram', emoji: '📸', color: 'pink' },
  { key: 'x',        label: 'X / Twitter', emoji: '𝕏',  color: 'sky' },
  { key: 'facebook', label: 'Facebook',  emoji: '👥', color: 'blue' },
  { key: 'tiktok',   label: 'TikTok',    emoji: '🎬', color: 'violet' },
];

const NET_COLORS: Record<string, string> = {
  instagram: 'border-pink-700 bg-pink-950',
  x:         'border-sky-700 bg-sky-950',
  facebook:  'border-blue-700 bg-blue-950',
  tiktok:    'border-violet-700 bg-violet-950',
};

const NET_TEXT: Record<string, string> = {
  instagram: 'text-pink-300',
  x:         'text-sky-300',
  facebook:  'text-blue-300',
  tiktok:    'text-violet-300',
};

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Agrupa items por fecha + hora (slot)
function groupBySlot(items: ParrillaItem[]) {
  const slots: Record<string, ParrillaItem[]> = {};
  for (const item of items) {
    const d = new Date(item.scheduledFor);
    d.setMinutes(0, 0, 0);
    const key = d.toISOString();
    if (!slots[key]) slots[key] = [];
    slots[key].push(item);
  }
  return slots;
}

export default function ParrillaView() {
  const [items, setItems] = useState<ParrillaItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/parrilla');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  async function remove(id: string) {
    await fetch('/api/parrilla', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  useEffect(() => { load(); }, []);

  const slots = groupBySlot(items);
  const slotKeys = Object.keys(slots).sort();
  const hasConflicts = items.some(i => i.conflicts.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-lg font-bold">Parrilla de publicación</h1>
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-white transition-colors">↻ Actualizar</button>
      </header>

      {/* Alerta de conflictos */}
      {hasConflicts && (
        <div className="mx-6 mt-4 bg-red-950 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <div>
            <p className="text-red-300 text-sm font-medium">Conflictos detectados</p>
            <p className="text-red-500 text-xs">Hay posts programados en la misma red y hora. El alcance de ambos se verá afectado.</p>
          </div>
        </div>
      )}

      <main className="px-6 py-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">La parrilla está vacía</p>
            <p className="text-sm">Agrega notas desde el dashboard principal</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">← Ir al dashboard</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {slotKeys.map(slotKey => {
              const slotItems = slots[slotKey];
              const slotDate = new Date(slotKey);
              const networkCount: Record<string, number> = {};
              slotItems.forEach(i => { networkCount[i.network] = (networkCount[i.network] || 0) + 1; });
              const slotHasConflict = Object.values(networkCount).some(c => c > 1);

              return (
                <div key={slotKey}>
                  {/* Cabecera del slot */}
                  <div className={`flex items-center gap-3 mb-3 ${slotHasConflict ? 'text-red-400' : 'text-gray-400'}`}>
                    <div className={`h-px flex-1 ${slotHasConflict ? 'bg-red-900' : 'bg-gray-800'}`} />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {slotHasConflict && '⚠️ '}
                      {formatDate(slotKey)} · {formatHour(slotKey)}
                    </span>
                    <div className={`h-px flex-1 ${slotHasConflict ? 'bg-red-900' : 'bg-gray-800'}`} />
                  </div>

                  {/* Items del slot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slotItems.map(item => {
                      const hasConflict = item.conflicts.length > 0;
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-4 ${hasConflict ? 'border-red-800 bg-red-950/40' : NET_COLORS[item.network] || 'border-gray-700 bg-gray-900'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${NET_TEXT[item.network]}`}>
                                  {NETWORKS.find(n => n.key === item.network)?.emoji} {NETWORKS.find(n => n.key === item.network)?.label}
                                </span>
                                {hasConflict && (
                                  <span className="text-xs bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
                                    ⚠️ Conflicto
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium leading-tight">{item.articleTitle}</p>
                              {item.copy && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.copy}</p>
                              )}
                              {item.hashtags?.length > 0 && (
                                <p className="text-xs text-blue-400 mt-1">{item.hashtags.join(' ')}</p>
                              )}
                            </div>
                            <button
                              onClick={() => remove(item.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
                              title="Quitar de parrilla"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
