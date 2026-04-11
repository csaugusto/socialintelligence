'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type NetworkScore = {
  content: number;
  recommendation: { action: string; label: string };
};

type Idea = {
  id: string;
  title: string;
  angle?: string;
  decayType: string;
  sourceTrend: string;
  scores: Record<string, NetworkScore>;
  brief?: object;
  createdAt: string;
};

const NETWORKS = [
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'x',         label: 'X',         icon: '✕' },
  { key: 'facebook',  label: 'Facebook',  icon: '👥' },
];

const DECAY: Record<string, { label: string; color: string }> = {
  INMEDIATA: { label: 'Urgente',   color: '#EC4899' },
  CORTA:     { label: '48h',       color: '#F59E0B' },
  NORMAL:    { label: '1 semana',  color: '#A09EC0' },
  EVERGREEN: { label: 'Evergreen', color: '#10B981' },
};

function scoreColor(v: number) {
  if (v >= 70) return '#A855F7';
  if (v >= 55) return '#F59E0B';
  if (v >= 35) return '#F97316';
  return '#5C5A7A';
}

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

export default function BriefsPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => {
        const withBrief = Array.isArray(data) ? data.filter((a: Idea) => !!a.brief) : [];
        // Ordenar por score desc
        withBrief.sort((a: Idea, b: Idea) => topScore(b) - topScore(a));
        setIdeas(withBrief);
        setLoading(false);
      });
  }, []);

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Briefs</h1>
        <p className="text-sm mt-0.5" style={{ color: '#5C5A7A' }}>
          Ideas con brief generado — listos para producir
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm" style={{ color: '#5C5A7A' }}>Cargando briefs...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-base font-medium text-white mb-1">Sin briefs aún</p>
          <p className="text-sm mb-4" style={{ color: '#5C5A7A' }}>
            Desarrolla una tendencia desde Inicio para generar tu primer brief
          </p>
          <Link href="/"
            className="btn-primary text-sm px-4 py-2 rounded-xl">
            Ir a Inicio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => {
            const net = topNet(idea);
            const score = topScore(idea);
            const decay = DECAY[idea.decayType] || DECAY['NORMAL'];
            const date = new Date(idea.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

            return (
              <Link
                key={idea.id}
                href={`/briefs/${idea.id}`}
                className="block rounded-2xl border p-4 transition-all group"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#13112A' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex items-start gap-4">
                  {/* Score */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-sm font-bold leading-none" style={{ color: scoreColor(score) }}>{score}</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#5C5A7A' }}>score</span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug mb-1.5 group-hover:text-purple-200 transition-colors">
                      {idea.title}
                    </p>
                    {idea.angle && (
                      <p className="text-xs mb-2" style={{ color: '#A09EC0' }}>
                        <span style={{ color: '#7C3AED' }}>→ </span>{idea.angle}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(124,58,237,0.12)', color: '#A855F7', border: '1px solid rgba(124,58,237,0.25)' }}>
                        {net.icon} {net.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.04)', color: decay.color, border: '1px solid rgba(255,255,255,0.06)' }}>
                        ⏱ {decay.label}
                      </span>
                      <span className="text-xs ml-auto" style={{ color: '#5C5A7A' }}>{date}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 self-center transition-transform group-hover:translate-x-0.5"
                    style={{ color: '#3A3858' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
