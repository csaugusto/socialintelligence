'use client';

import { StepProps } from '../wizard';
import {
  LightningIcon,
  FlameIcon,
  ScalesIcon,
  CalendarDotsIcon,
  RobotIcon,
  VideoCameraIcon,
  TimerIcon,
  SparkleIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

type Frecuencia  = { value: string; label: string; Icon: PhosphorIcon; sub: string };
type Capacidad   = { value: string; label: string; Icon: PhosphorIcon; sub: string };

const FRECUENCIAS: Frecuencia[] = [
  { value: 'diario',      label: 'Diario',                Icon: LightningIcon,   sub: 'Publico todos los días' },
  { value: '3-4x',        label: '3–4 veces por semana',  Icon: FlameIcon,       sub: 'Alta frecuencia' },
  { value: '1-2x',        label: '1–2 veces por semana',  Icon: ScalesIcon,      sub: 'Frecuencia moderada' },
  { value: 'semanal',     label: '1 artículo semanal',    Icon: CalendarDotsIcon,sub: 'Contenido más elaborado' },
  { value: 'recomendado', label: 'Que me recomienden',    Icon: RobotIcon,       sub: 'Deja que el sistema decida' },
];

const CAPACIDADES: Capacidad[] = [
  { value: 'grabar_mucho',  label: 'Puedo grabar mucho',              Icon: VideoCameraIcon, sub: 'Tengo tiempo y setup para producir' },
  { value: 'poco_tiempo',   label: 'Tengo poco tiempo',               Icon: TimerIcon,       sub: 'Necesito ideas rápidas de ejecutar' },
  { value: 'ideas_rapidas', label: 'Quiero ideas rápidas',            Icon: LightningIcon,   sub: 'Prefiero contenido ligero' },
  { value: 'elaboradas',    label: 'Puedo producir piezas trabajadas', Icon: SparkleIcon,    sub: 'Calidad sobre cantidad' },
];

export default function Step7Ritmo({ data, update, onNext, onPrev }: StepProps) {
  const canContinue = !!data.frequency && !!data.productionCapacity;

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 8 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿Cuál es tu ritmo?</h1>
        <p className="text-white/50 text-base">
          Esto nos ayuda a calibrar la cantidad y complejidad de las ideas que te sugerimos.
        </p>
      </div>

      <p className="text-white/60 text-sm font-medium mb-3">¿Qué tan seguido quieres publicar?</p>
      <div className="grid grid-cols-1 gap-2 mb-7">
        {FRECUENCIAS.map(f => {
          const isSelected = data.frequency === f.value;
          return (
            <button
              key={f.value}
              onClick={() => update({ frequency: f.value })}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-150 text-left ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10'
                  : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
            >
              <f.Icon
                size={20}
                weight="light"
                color={isSelected ? '#A855F7' : '#5C5A7A'}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>{f.label}</p>
                <p className="text-xs text-white/35">{f.sub}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-white/60 text-sm font-medium mb-3">¿Qué tan fácil es para ti producir contenido?</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {CAPACIDADES.map(c => {
          const isSelected = data.productionCapacity === c.value;
          return (
            <button
              key={c.value}
              onClick={() => update({ productionCapacity: c.value })}
              className={`relative text-left px-4 py-4 rounded-xl border transition-all duration-150 ${
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
              <c.Icon
                size={22}
                weight="light"
                color={isSelected ? '#A855F7' : '#5C5A7A'}
                className="mb-2"
              />
              <p className={`text-sm font-medium mb-0.5 ${isSelected ? 'text-white' : 'text-white/70'}`}>{c.label}</p>
              <p className="text-xs text-white/35">{c.sub}</p>
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
