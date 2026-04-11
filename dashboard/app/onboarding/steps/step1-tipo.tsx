import {
  VideoCameraIcon,
  UserCircleIcon,
  BuildingsIcon,
  NewspaperIcon,
  TargetIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type TipoOption = {
  value: string;
  Icon: PhosphorIcon;
  label: string;
  sub: string;
};

const TIPOS: TipoOption[] = [
  { value: 'creator',  Icon: VideoCameraIcon, label: 'Creador de contenido', sub: 'Quieres hacer crecer tu audiencia y no quedarte sin ideas.' },
  { value: 'brand',    Icon: UserCircleIcon,  label: 'Marca personal',       sub: 'Quieres ganar fuerza y reconocimiento.' },
  { value: 'company',  Icon: BuildingsIcon,   label: 'Empresa / negocio',    sub: 'Quieres impulsar tu negocio a través del contenido.' },
  { value: 'media',    Icon: NewspaperIcon,   label: 'Medio / blog',         sub: 'Quieres atraer tráfico y hacer crecer tu audiencia.' },
  { value: 'agency',   Icon: TargetIcon,      label: 'Agencia',              sub: 'Gestionas el contenido de varios clientes.' },
];

export default function Step1Tipo({ data, update, onNext }: StepProps) {
  const canContinue = !!data.accountType;

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 1 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">Listos para despegar</h1>
        <p className="text-white/50 text-base">
          Cuéntanos quién eres, qué quieres lograr y cómo podemos ayudarte a crecer.
        </p>
      </div>

      <p className="text-white/60 text-sm font-medium mb-4">¿Qué describe mejor tu cuenta?</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {TIPOS.map(tipo => {
          const selected = data.accountType === tipo.value;
          return (
            <button
              key={tipo.value}
              onClick={() => update({ accountType: tipo.value })}
              className={`relative text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${
                selected
                  ? 'border-purple-500/60 bg-purple-600/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                  : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
              style={{ borderColor: selected ? 'rgba(124,58,237,0.6)' : undefined }}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="mb-2.5">
                <tipo.Icon size={28} weight="light" color={selected ? '#A855F7' : '#5C5A7A'} />
              </div>
              <p className={`text-sm font-semibold mb-1 ${selected ? 'text-white' : 'text-white/70'}`}>
                {tipo.label}
              </p>
              <p className="text-xs text-white/40 leading-relaxed">{tipo.sub}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="btn-primary w-full py-4 rounded-2xl transition-all duration-150"
      >
        Continuar
      </button>
    </div>
  );
}
