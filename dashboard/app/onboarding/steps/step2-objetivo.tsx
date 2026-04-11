import {
  RocketLaunchIcon,
  FireIcon,
  GlobeIcon,
  ScalesIcon,
  CurrencyDollarIcon,
  TargetIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type ObjetivoOption = {
  value: string;
  Icon: PhosphorIcon;
  label: string;
  sub: string;
};

const OBJETIVOS: ObjetivoOption[] = [
  { value: 'descubrir',  Icon: RocketLaunchIcon,    label: 'Quiero que más personas me descubran',          sub: 'Aumentar alcance y crecer mi audiencia.' },
  { value: 'interaccion',Icon: FireIcon,             label: 'Quiero que más personas interactúen conmigo',   sub: 'Incrementar likes, shares y comentarios.' },
  { value: 'trafico',    Icon: GlobeIcon,            label: 'Quiero llevar más visitas a mi sitio',          sub: 'Atraer más tráfico a mi web.' },
  { value: 'confianza',  Icon: ScalesIcon,           label: 'Quiero que más personas confíen en mi marca',   sub: 'Construir autoridad y credibilidad.' },
  { value: 'conversion', Icon: CurrencyDollarIcon,   label: 'Quiero convertir seguidores en clientes',       sub: 'Generar leads, ventas o suscriptores.' },
  { value: 'equilibrio', Icon: TargetIcon,           label: 'Quiero crecer de forma equilibrada',            sub: 'Un poco de todo, sin prioridad específica.' },
];

export default function Step2Objetivo({ data, update, onNext, onPrev }: StepProps) {
  const selected = data.objectives;
  const canContinue = selected.length > 0;

  function toggle(value: string) {
    if (selected.includes(value)) {
      update({ objectives: selected.filter(v => v !== value) });
    } else if (selected.length < 2) {
      update({ objectives: [...selected, value] });
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 2 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿Qué quieres lograr?</h1>
        <p className="text-white/50 text-base">
          Dinos qué te gustaría lograr para recomendarte ideas que se alineen con tus metas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {OBJETIVOS.map(obj => {
          const isSelected = selected.includes(obj.value);
          const isDisabled = !isSelected && selected.length >= 2;
          return (
            <button
              key={obj.value}
              onClick={() => toggle(obj.value)}
              disabled={isDisabled}
              className={`relative text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                  : isDisabled
                    ? 'border-white/5 bg-white/2 opacity-40 cursor-not-allowed'
                    : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="mb-2.5">
                <obj.Icon size={26} weight="light" color={isSelected ? '#A855F7' : '#5C5A7A'} />
              </div>
              <p className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {obj.label}
              </p>
              <p className="text-xs text-white/40 leading-relaxed">{obj.sub}</p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-white/30 text-center mb-6">
        Puedes elegir hasta 2, pero uno solo nos ayuda a priorizar mejor tus ideas.
      </p>

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
