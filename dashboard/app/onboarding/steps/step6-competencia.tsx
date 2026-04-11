'use client';

import { useState } from 'react';
import { StepProps, Competitor } from '../wizard';
import {
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
  XLogoIcon,
  LinkedinLogoIcon,
  GlobeHemisphereWestIcon,
  PencilSimpleIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

type Plataforma = { value: string; Icon: PhosphorIcon };

const PLATAFORMAS: Plataforma[] = [
  { value: 'instagram', Icon: InstagramLogoIcon },
  { value: 'tiktok',    Icon: TiktokLogoIcon },
  { value: 'youtube',   Icon: YoutubeLogoIcon },
  { value: 'x',         Icon: XLogoIcon },
  { value: 'linkedin',  Icon: LinkedinLogoIcon },
  { value: 'web',       Icon: GlobeHemisphereWestIcon },
  { value: 'blog',      Icon: PencilSimpleIcon },
];

const LABEL_OPTIONS: { value: Competitor['label']; label: string; color: string }[] = [
  { value: 'competencia', label: 'Competencia directa',    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { value: 'inspiracion', label: 'Inspiración',            color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'benchmark',   label: 'Benchmark',              color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { value: 'referente',   label: 'Referente aspiracional', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

export default function Step6Competencia({ data, update, onNext, onPrev }: StepProps) {
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [label, setLabel] = useState<Competitor['label']>('competencia');
  const [displayName, setDisplayName] = useState('');

  const competitors = data.competitors;

  function addCompetitor() {
    const h = handle.trim();
    if (!h) return;
    const newC: Competitor = { handle: h, platform, label, display_name: displayName.trim() || undefined };
    update({ competitors: [...competitors, newC] });
    setHandle('');
    setDisplayName('');
  }

  function remove(i: number) {
    update({ competitors: competitors.filter((_, idx) => idx !== i) });
  }

  const labelMap = Object.fromEntries(LABEL_OPTIONS.map(l => [l.value, l]));

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 7 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿A quién deberíamos observar?</h1>
        <p className="text-white/50 text-base">
          Agrega cuentas, medios o creadores que quieras monitorear como referencia o competencia.
        </p>
      </div>

      {/* Input para agregar */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4 mb-5">
        {/* Selector de plataforma */}
        <div className="flex gap-2 mb-4">
          {PLATAFORMAS.map(p => {
            const isActive = platform === p.value;
            return (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                  isActive
                    ? 'border-purple-500/60 bg-purple-600/20'
                    : 'border-white/8 bg-white/3 hover:border-purple-500/30'
                }`}
                title={p.value}
              >
                <p.Icon
                  size={18}
                  weight="light"
                  color={isActive ? '#A855F7' : '#5C5A7A'}
                />
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCompetitor()}
            placeholder="@handle o URL del competidor"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
          />
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Nombre (opcional)"
            className="w-40 px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>

        {/* Selector de etiqueta */}
        <div className="flex flex-wrap gap-2 mb-4">
          {LABEL_OPTIONS.map(l => (
            <button
              key={l.value}
              onClick={() => setLabel(l.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                label === l.value ? l.color : 'border-white/8 text-white/30 hover:text-white/60'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={addCompetitor}
          disabled={!handle.trim()}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white/70 border border-white/10 hover:border-purple-500/40 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          + Agregar competidor
        </button>
      </div>

      {/* Lista de competidores agregados */}
      {competitors.length > 0 && (
        <div className="space-y-2 mb-6">
          {competitors.map((c, i) => {
            const plat = PLATAFORMAS.find(p => p.value === c.platform);
            const lbl = labelMap[c.label];
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-white/3">
                <div className="flex items-center gap-3">
                  {plat && <plat.Icon size={18} weight="light" color="#5C5A7A" />}
                  <div>
                    <p className="text-sm font-medium text-white">{c.display_name || c.handle}</p>
                    {c.display_name && <p className="text-xs text-white/40">{c.handle}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${lbl?.color}`}>
                    {lbl?.label}
                  </span>
                </div>
                <button
                  onClick={() => remove(i)}
                  className="text-white/20 hover:text-white/60 transition-colors ml-2"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {competitors.length === 0 && (
        <p className="text-xs text-white/25 text-center mb-6">
          También puedes agregar sitios web, blogs o newsletters
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onPrev}
          className="px-6 py-3 rounded-xl text-sm font-medium text-white/40 border border-white/8 hover:text-white/70 hover:border-white/20 transition-all"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="btn-primary flex-1 py-4 rounded-2xl"
        >
          {competitors.length === 0 ? 'Omitir por ahora' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
