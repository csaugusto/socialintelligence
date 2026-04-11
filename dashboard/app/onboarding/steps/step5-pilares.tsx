import {
  NewspaperIcon,
  ChatCircleIcon,
  LightbulbIcon,
  BookOpenIcon,
  StarIcon,
  SmileyIcon,
  GraduationCapIcon,
  TrendUpIcon,
  SparkleIcon,
  MagnifyingGlassIcon,
  FilmSlateIcon,
  UsersThreeIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type PilarOption = {
  value: string;
  label: string;
  sub: string;
  Icon: PhosphorIcon;
};

const PILARES: PilarOption[] = [
  { value: 'noticias',    label: 'Noticias',          sub: 'Actualidad de tu sector',         Icon: NewspaperIcon },
  { value: 'opinion',     label: 'Opinión',           sub: 'Tu punto de vista',               Icon: ChatCircleIcon },
  { value: 'tips',        label: 'Tips',              sub: 'Consejos prácticos',              Icon: LightbulbIcon },
  { value: 'historias',   label: 'Historias',         sub: 'Narrativa personal o ajena',      Icon: BookOpenIcon },
  { value: 'resenas',     label: 'Reseñas',           sub: 'Análisis y reviews',              Icon: StarIcon },
  { value: 'humor',       label: 'Humor',             sub: 'Entretenimiento ligero',          Icon: SmileyIcon },
  { value: 'tutoriales',  label: 'Tutoriales',        sub: 'Paso a paso, how-to',             Icon: GraduationCapIcon },
  { value: 'tendencias',  label: 'Tendencias',        sub: 'Lo que está viral ahora',         Icon: TrendUpIcon },
  { value: 'inspiracion', label: 'Inspiración',       sub: 'Motivación y mindset',            Icon: SparkleIcon },
  { value: 'seo',         label: 'SEO / Artículos',   sub: 'Contenido para buscadores',       Icon: MagnifyingGlassIcon },
  { value: 'detras',      label: 'Detrás de escena',  sub: 'Behind the scenes',               Icon: FilmSlateIcon },
  { value: 'comunidad',   label: 'Comunidad',         sub: 'Interacción con tu audiencia',    Icon: UsersThreeIcon },
];

export default function Step5Pilares({ data, update, onNext, onPrev }: StepProps) {
  const selected = data.pillars;
  const canContinue = selected.length >= 3;

  function toggle(value: string) {
    if (selected.includes(value)) {
      update({ pillars: selected.filter(v => v !== value) });
    } else if (selected.length < 5) {
      update({ pillars: [...selected, value] });
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 6 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿Qué tipo de contenido haces?</h1>
        <p className="text-white/50 text-base">
          Selecciona entre 3 y 5 pilares. Esto define la mezcla de contenido que te recomendaremos.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {PILARES.map(p => {
          const isSelected = selected.includes(p.value);
          const isDisabled = !isSelected && selected.length >= 5;
          return (
            <button
              key={p.value}
              onClick={() => toggle(p.value)}
              disabled={isDisabled}
              className={`relative text-left px-4 py-3.5 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10'
                  : isDisabled
                    ? 'border-white/5 bg-white/2 opacity-30 cursor-not-allowed'
                    : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="mb-1.5">
                <p.Icon size={22} weight="light" color={isSelected ? '#A855F7' : '#5C5A7A'} />
              </div>
              <p className={`text-sm font-medium mb-0.5 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {p.label}
              </p>
              <p className="text-xs text-white/35">{p.sub}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-8">
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <div
              key={n}
              className={`w-6 h-1.5 rounded-full transition-all duration-200 ${
                n <= selected.length ? 'bg-purple-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-white/30">
          {selected.length}/5 seleccionados {selected.length < 3 && `(mínimo 3)`}
        </span>
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
