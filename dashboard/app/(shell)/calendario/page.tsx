'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type KanbanState =
  | 'detectada'
  | 'validada'
  | 'brief_listo'
  | 'en_creacion'
  | 'revisando'
  | 'aprobada'
  | 'programada'
  | 'publicada';

type Idea = {
  id: string;
  title: string;
  angle?: string;
  decayType: string;
  scores: Record<string, { content: number }>;
  brief?: object | null;
  createdAt: string;
};

type PipelineItem = Idea & {
  state: KanbanState;
  scheduledDate?: string; // ISO date string "YYYY-MM-DD"
};

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { key: KanbanState; label: string; color: string; abbr: string }[] = [
  { key: 'detectada',   label: 'Detectada',    color: '#5C5A7A', abbr: 'D' },
  { key: 'validada',    label: 'Validada',     color: '#A09EC0', abbr: 'V' },
  { key: 'brief_listo', label: 'Brief listo',  color: '#7C3AED', abbr: 'B' },
  { key: 'en_creacion', label: 'En creación',  color: '#2563EB', abbr: 'C' },
  { key: 'revisando',   label: 'Revisando',    color: '#F59E0B', abbr: 'R' },
  { key: 'aprobada',    label: 'Aprobada',     color: '#10B981', abbr: 'A' },
  { key: 'programada',  label: 'Programada',   color: '#06B6D4', abbr: 'P' },
  { key: 'publicada',   label: 'Publicada',    color: '#A855F7', abbr: '✓' },
];

const DECAY: Record<string, { label: string; color: string }> = {
  INMEDIATA: { label: 'Urgente',   color: '#EC4899' },
  CORTA:     { label: '48h',       color: '#F59E0B' },
  NORMAL:    { label: '1 semana',  color: '#A09EC0' },
  EVERGREEN: { label: 'Evergreen', color: '#10B981' },
};

const NETWORKS = ['tiktok', 'instagram', 'x', 'facebook'];
const NET_LABEL: Record<string, string> = { tiktok: 'TikTok', instagram: 'IG', x: 'X', facebook: 'FB' };
const NET_ICON: Record<string, string> = { tiktok: '🎵', instagram: '📸', x: '✕', facebook: '👥' };

const RUTINA = [
  { label: 'Descubrimiento',  desc: '2–3 piezas / semana', pct: 40, color: '#A855F7' },
  { label: 'Conexión',        desc: '2 piezas / semana',   pct: 30, color: '#7C3AED' },
  { label: 'Autoridad',       desc: '1–2 piezas / semana', pct: 20, color: '#2563EB' },
  { label: 'Conversión',      desc: '1 pieza / semana',    pct: 10, color: '#10B981' },
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function topScore(idea: Idea) {
  return Math.max(0, ...NETWORKS.map(n => idea.scores?.[n]?.content || 0));
}

function topNet(idea: Idea) {
  return NETWORKS.reduce((best, n) => {
    return (idea.scores?.[n]?.content || 0) > (idea.scores?.[best]?.content || 0) ? n : best;
  }, NETWORKS[0]);
}

function getWeekDates(offset = 0): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isToday(d: Date) {
  return toISODate(d) === toISODate(new Date());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DecayBadge({ type }: { type: string }) {
  const d = DECAY[type] || DECAY['NORMAL'];
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
      style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}30` }}>
      {d.label}
    </span>
  );
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 70 ? '#A855F7' : score >= 55 ? '#F59E0B' : score >= 35 ? '#F97316' : '#5C5A7A';
  return (
    <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{score}</span>
  );
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCard({
  item,
  onDragStart,
}: {
  item: PipelineItem;
  onDragStart: (id: string) => void;
}) {
  const score = topScore(item);
  const net = topNet(item);
  const col = COLUMNS.find(c => c.key === item.state)!;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      className="rounded-xl border p-3 cursor-grab active:cursor-grabbing select-none group transition-all"
      style={{ background: '#13112A', borderColor: 'rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${col.color}40`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <p className="text-xs font-medium text-white leading-snug mb-2 line-clamp-2">{item.title}</p>
      {item.angle && (
        <p className="text-[10px] mb-2 line-clamp-1" style={{ color: '#7C3AED' }}>→ {item.angle}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DecayBadge type={item.decayType} />
          <span className="text-[10px]" style={{ color: '#5C5A7A' }}>
            {NET_ICON[net]} {NET_LABEL[net]}
          </span>
        </div>
        <ScoreDot score={score} />
      </div>
      {item.brief && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link
            href={`/briefs/${item.id}`}
            onClick={e => e.stopPropagation()}
            className="text-[10px] transition-colors"
            style={{ color: '#7C3AED' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#A855F7'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7C3AED'; }}
          >
            Ver brief →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  items,
  onDragStart,
  onDrop,
  dragOver,
  setDragOver,
}: {
  col: typeof COLUMNS[number];
  items: PipelineItem[];
  onDragStart: (id: string) => void;
  onDrop: (state: KanbanState) => void;
  dragOver: string | null;
  setDragOver: (s: string | null) => void;
}) {
  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl transition-all"
      style={{
        width: 220,
        background: dragOver === col.key ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${dragOver === col.key ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)'}`,
      }}
      onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={() => { onDrop(col.key); setDragOver(null); }}
    >
      {/* Column header */}
      <div className="px-3 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center"
            style={{ background: `${col.color}20`, color: col.color }}>
            {col.abbr}
          </span>
          <span className="text-xs font-medium" style={{ color: '#C4C2E0' }}>{col.label}</span>
        </div>
        <span className="text-[11px] px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#5C5A7A' }}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {items.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-xl border border-dashed"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px]" style={{ color: '#3A3858' }}>Arrastra aquí</p>
          </div>
        )}
        {items.map(item => (
          <KanbanCard key={item.id} item={item} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  items,
  weekOffset,
  setWeekOffset,
  onSchedule,
}: {
  items: PipelineItem[];
  weekOffset: number;
  setWeekOffset: (v: number) => void;
  onSchedule: (id: string, date: string) => void;
}) {
  const dates = getWeekDates(weekOffset);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const unscheduled = items.filter(i => !i.scheduledDate && i.state !== 'publicada');

  return (
    <div className="flex gap-4 min-h-0">
      {/* Calendar grid */}
      <div className="flex-1">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#A09EC0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
            >
              ‹
            </button>
            <span className="text-sm font-medium text-white">
              {dates[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              {' — '}
              {dates[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#A09EC0' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
            >
              ›
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7' }}
              >
                Hoy
              </button>
            )}
          </div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date, i) => {
            const dateStr = toISODate(date);
            const dayItems = items.filter(it => it.scheduledDate === dateStr);
            const today = isToday(date);
            const isDragOver = dragOverDate === dateStr;

            return (
              <div key={dateStr}
                className="flex flex-col rounded-xl border transition-all"
                style={{
                  minHeight: 140,
                  background: isDragOver ? 'rgba(124,58,237,0.08)' : today ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.02)',
                  borderColor: isDragOver ? 'rgba(124,58,237,0.3)' : today ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                }}
                onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={() => {
                  if (draggingId) { onSchedule(draggingId, dateStr); setDraggingId(null); }
                  setDragOverDate(null);
                }}
              >
                {/* Day header */}
                <div className="px-2 pt-2 pb-1.5 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px]" style={{ color: '#5C5A7A' }}>{WEEK_DAYS[i]}</span>
                  <span className="text-xs font-semibold"
                    style={{ color: today ? '#A855F7' : '#A09EC0' }}>
                    {date.getDate()}
                  </span>
                </div>

                {/* Items */}
                <div className="flex-1 p-1.5 space-y-1">
                  {dayItems.length === 0 && isDragOver && (
                    <div className="h-8 rounded-lg border border-dashed flex items-center justify-center"
                      style={{ borderColor: 'rgba(124,58,237,0.4)' }}>
                      <span className="text-[9px]" style={{ color: '#7C3AED' }}>Soltar aquí</span>
                    </div>
                  )}
                  {dayItems.map(item => {
                    const net = topNet(item);
                    const col = COLUMNS.find(c => c.key === item.state)!;
                    return (
                      <div key={item.id}
                        draggable
                        onDragStart={() => setDraggingId(item.id)}
                        className="rounded-lg p-1.5 cursor-grab text-[10px] transition-all"
                        style={{ background: `${col.color}18`, border: `1px solid ${col.color}30`, color: '#C4C2E0' }}
                        title={item.title}
                      >
                        <p className="font-medium leading-snug line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span style={{ color: col.color }}>{col.label}</span>
                          <span style={{ color: '#5C5A7A' }}>· {NET_ICON[net]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unscheduled drag zone */}
        {unscheduled.length > 0 && (
          <div className="mt-4">
            <p className="text-xs mb-2 font-medium" style={{ color: '#5C5A7A' }}>
              Sin programar — arrastra a un día
            </p>
            <div className="flex flex-wrap gap-2">
              {unscheduled.map(item => (
                <div key={item.id}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  className="rounded-xl border px-3 py-2 cursor-grab text-xs transition-all"
                  style={{ background: '#13112A', borderColor: 'rgba(255,255,255,0.08)', color: '#A09EC0', maxWidth: 200 }}
                >
                  <p className="font-medium text-white line-clamp-1 mb-0.5">{item.title}</p>
                  <DecayBadge type={item.decayType} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rutina sugerida */}
      <div className="w-56 flex-shrink-0">
        <div className="rounded-2xl border p-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold text-white mb-1">Rutina sugerida</p>
          <p className="text-[10px] mb-4" style={{ color: '#5C5A7A' }}>Mix semanal recomendado para crecer en orgánico</p>

          <div className="space-y-3">
            {RUTINA.map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: '#C4C2E0' }}>{r.label}</span>
                  <span className="text-[10px]" style={{ color: '#5C5A7A' }}>{r.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: '#5C5A7A' }}>{r.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] font-medium mb-2" style={{ color: '#A09EC0' }}>Esta semana</p>
            <div className="space-y-1">
              {[0, 1, 2].map(i => {
                const date = getWeekDates(weekOffset)[i];
                const dateStr = toISODate(date);
                const count = items.filter(it => it.scheduledDate === dateStr).length;
                if (count === 0) return null;
                return (
                  <div key={dateStr} className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: '#5C5A7A' }}>
                      {date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: '#A855F7' }}>
                      {count} pieza{count > 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const [view, setView] = useState<'kanban' | 'semana'>('kanban');
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Load from API + merge localStorage state
  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then((data: Idea[]) => {
        if (!Array.isArray(data)) return;

        const storedStates: Record<string, KanbanState> = JSON.parse(
          localStorage.getItem('pipeline_states') || '{}'
        );
        const storedSchedule: Record<string, string> = JSON.parse(
          localStorage.getItem('pipeline_schedule') || '{}'
        );

        const merged: PipelineItem[] = data.map((idea) => ({
          ...idea,
          state: storedStates[idea.id] || (idea.brief ? 'brief_listo' : 'detectada'),
          scheduledDate: storedSchedule[idea.id],
        }));

        // Sort by score desc
        merged.sort((a, b) => topScore(b) - topScore(a));
        setItems(merged);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function moveCard(id: string, toState: KanbanState) {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, state: toState } : it);
      const states: Record<string, KanbanState> = {};
      next.forEach(it => { states[it.id] = it.state; });
      localStorage.setItem('pipeline_states', JSON.stringify(states));
      return next;
    });
  }

  function scheduleItem(id: string, date: string) {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, scheduledDate: date, state: it.state === 'detectada' ? 'validada' : it.state } : it);
      const schedule: Record<string, string> = {};
      const states: Record<string, KanbanState> = {};
      next.forEach(it => {
        if (it.scheduledDate) schedule[it.id] = it.scheduledDate;
        states[it.id] = it.state;
      });
      localStorage.setItem('pipeline_schedule', JSON.stringify(schedule));
      localStorage.setItem('pipeline_states', JSON.stringify(states));
      return next;
    });
  }

  return (
    <div className="px-6 py-6 flex flex-col min-h-0" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white">Pipeline</h1>
          <p className="text-sm mt-0.5" style={{ color: '#5C5A7A' }}>
            {items.length} ideas en seguimiento
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([
            { key: 'kanban', icon: '▦', label: 'Kanban' },
            { key: 'semana', icon: '▤', label: 'Semana' },
          ] as const).map(v => (
            <button key={v.key}
              onClick={() => setView(v.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              style={view === v.key
                ? { background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }
                : { color: '#5C5A7A' }
              }
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm" style={{ color: '#5C5A7A' }}>Cargando pipeline...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-base font-medium text-white mb-1">Pipeline vacío</p>
            <p className="text-sm mb-4" style={{ color: '#5C5A7A' }}>
              Explora oportunidades y agrégalas al pipeline
            </p>
            <Link href="/oportunidades"
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', color: 'white' }}>
              Ver oportunidades
            </Link>
          </div>
        </div>
      ) : view === 'kanban' ? (
        /* ── Kanban board ── */
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1" style={{ minHeight: 0 }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              col={col}
              items={items.filter(it => it.state === col.key)}
              onDragStart={id => setDragId(id)}
              onDrop={state => { if (dragId) moveCard(dragId, state); setDragId(null); }}
              dragOver={dragOver}
              setDragOver={setDragOver}
            />
          ))}
        </div>
      ) : (
        /* ── Week view ── */
        <div className="flex-1 overflow-y-auto">
          <WeekView
            items={items}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            onSchedule={scheduleItem}
          />
        </div>
      )}

      {/* Pipeline state legend (kanban only) */}
      {!loading && items.length > 0 && view === 'kanban' && (
        <div className="flex-shrink-0 mt-3 flex items-center gap-3 flex-wrap">
          <span className="text-[10px]" style={{ color: '#3A3858' }}>Arrastra las cards para mover entre estados</span>
          <div className="flex items-center gap-2 flex-wrap">
            {COLUMNS.map(col => (
              <div key={col.key} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
                <span className="text-[10px]" style={{ color: '#5C5A7A' }}>{col.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
