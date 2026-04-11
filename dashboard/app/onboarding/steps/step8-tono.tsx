import { useState } from 'react';
import {
  BriefcaseIcon,
  HandshakeIcon,
  LightningIcon,
  BooksIcon,
  SparkleIcon,
  FireIcon,
  SmileyIcon,
  BookOpenIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type TonoOption = {
  value: string;
  label: string;
  sub: string;
  Icon: PhosphorIcon;
};

const TONOS: TonoOption[] = [
  { value: 'profesional',  label: 'Profesional',  sub: 'Formal, autoridad, credibilidad',         Icon: BriefcaseIcon },
  { value: 'cercano',      label: 'Cercano',       sub: 'Conversacional, empático, cálido',         Icon: HandshakeIcon },
  { value: 'directo',      label: 'Directo',       sub: 'Sin rodeos, al grano, eficiente',          Icon: LightningIcon },
  { value: 'educativo',    label: 'Educativo',     sub: 'Explicativo, pedagógico, claro',           Icon: BooksIcon },
  { value: 'inspirador',   label: 'Inspirador',    sub: 'Motivacional, aspiracional, positivo',     Icon: SparkleIcon },
  { value: 'provocador',   label: 'Provocador',    sub: 'Opinionado, disruptivo, debate',           Icon: FireIcon },
  { value: 'humoristico',  label: 'Humorístico',   sub: 'Ligero, entretenido, memes',              Icon: SmileyIcon },
  { value: 'narrativo',    label: 'Narrativo',     sub: 'Storytelling, emocional, inmersivo',      Icon: BookOpenIcon },
];

const TEMAS_EVITAR = [
  'Política',
  'Religión',
  'Temas muy técnicos',
  'Sexualidad',
  'Violencia',
  'Contenido negativo',
  'Competencia directa',
  'Precios y dinero',
];

const CONTROVERSIA = [
  { value: 0, label: 'Nada',     sub: 'Solo contenido neutro y seguro' },
  { value: 1, label: 'Mínima',   sub: 'Evita temas divisivos' },
  { value: 2, label: 'Moderada', sub: 'Opina con cuidado cuando vale la pena' },
  { value: 3, label: 'Alta',     sub: 'No evitas el debate ni los temas difíciles' },
];

export default function Step8Tono({ data, update, onNext, onPrev }: StepProps) {
  const [customAvoid, setCustomAvoid] = useState('');

  const toneAvoid = data.toneAvoid ?? [];
  const controversyLevel = data.controversyLevel ?? 1;
  const canContinue = !!data.tone;

  function toggleAvoid(topic: string) {
    if (toneAvoid.includes(topic)) {
      update({ toneAvoid: toneAvoid.filter(t => t !== topic) });
    } else {
      update({ toneAvoid: [...toneAvoid, topic] });
    }
  }

  function addCustom() {
    const val = customAvoid.trim();
    if (!val || toneAvoid.includes(val)) return;
    update({ toneAvoid: [...toneAvoid, val] });
    setCustomAvoid('');
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 9 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿Cómo es tu voz?</h1>
        <p className="text-white/50 text-base">
          Tu tono define cómo se comunica tu contenido. Esto nos ayuda a generar ideas alineadas con tu estilo.
        </p>
      </div>

      {/* Tono */}
      <p className="text-white/60 text-sm font-medium mb-3">Selecciona tu tono principal</p>
      <div className="grid grid-cols-2 gap-2.5 mb-7">
        {TONOS.map(t => {
          const isSelected = data.tone === t.value;
          return (
            <button
              key={t.value}
              onClick={() => update({ tone: t.value })}
              className={`relative text-left px-4 py-3.5 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10'
                  : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <t.Icon size={22} weight="light" color={isSelected ? '#A855F7' : '#5C5A7A'} />
                <div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>{t.label}</p>
                  <p className="text-xs text-white/35">{t.sub}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Temas a evitar */}
      <p className="text-white/60 text-sm font-medium mb-3">
        ¿Qué temas prefieres evitar? <span className="text-white/30 font-normal">(opcional)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {TEMAS_EVITAR.map(topic => {
          const isSelected = toneAvoid.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => toggleAvoid(topic)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? 'border-pink-500/50 bg-pink-600/15 text-pink-300'
                  : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {isSelected ? '✕ ' : ''}{topic}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-7">
        <input
          type="text"
          value={customAvoid}
          onChange={e => setCustomAvoid(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Agregar otro tema a evitar..."
          className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
        />
        <button
          onClick={addCustom}
          disabled={!customAvoid.trim()}
          className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/8 hover:border-purple-500/40 hover:text-white transition-all disabled:opacity-30"
        >
          Agregar
        </button>
      </div>

      {/* Nivel de controversia */}
      <p className="text-white/60 text-sm font-medium mb-3">Nivel de controversia que toleras</p>
      <div className="grid grid-cols-4 gap-2 mb-8">
        {CONTROVERSIA.map(c => {
          const isSelected = controversyLevel === c.value;
          return (
            <button
              key={c.value}
              onClick={() => update({ controversyLevel: c.value })}
              className={`text-left px-3 py-3 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10'
                  : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
            >
              <div className={`text-lg font-bold mb-1 ${isSelected ? 'text-purple-400' : 'text-white/30'}`}>
                {c.value}
              </div>
              <p className={`text-xs font-medium mb-0.5 ${isSelected ? 'text-white' : 'text-white/60'}`}>{c.label}</p>
              <p className="text-xs text-white/30 leading-tight">{c.sub}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPrev}
          className="px-6 py-3 rounded-xl text-sm font-medium text-white/40 border border-white/8 hover:text-white/70 hover:border-white/20 transition-all"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="btn-primary flex-1 py-4 rounded-2xl transition-all duration-150"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
