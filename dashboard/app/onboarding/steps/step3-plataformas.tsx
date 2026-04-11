import {
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
  FacebookLogoIcon,
  XLogoIcon,
  LinkedinLogoIcon,
  GlobeIcon,
  PencilSimpleIcon,
  EnvelopeSimpleIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type PlataformaOption = {
  value: string;
  label: string;
  sub: string;
  Icon: PhosphorIcon;
};

const PLATAFORMAS: PlataformaOption[] = [
  { value: 'instagram',  label: 'Instagram',  sub: 'Alcance y audiencia visual.',          Icon: InstagramLogoIcon },
  { value: 'tiktok',     label: 'TikTok',     sub: 'Viralidad, shares y comentarios.',     Icon: TiktokLogoIcon },
  { value: 'youtube',    label: 'YouTube',    sub: 'Videos, shorts y comunidad.',          Icon: YoutubeLogoIcon },
  { value: 'facebook',   label: 'Facebook',   sub: 'Grupos, ads y tráfico.',               Icon: FacebookLogoIcon },
  { value: 'x',          label: 'X',          sub: 'Conversación en tiempo real.',         Icon: XLogoIcon },
  { value: 'linkedin',   label: 'LinkedIn',   sub: 'Autoridad y networking B2B.',          Icon: LinkedinLogoIcon },
  { value: 'web',        label: 'Sitio web',  sub: 'Atraer tráfico orgánico.',             Icon: GlobeIcon },
  { value: 'blog',       label: 'Blog',       sub: 'SEO y contenido de largo plazo.',      Icon: PencilSimpleIcon },
  { value: 'newsletter', label: 'Newsletter', sub: 'Construir una audiencia propia.',      Icon: EnvelopeSimpleIcon },
];

export default function Step3Plataformas({ data, update, onNext, onPrev }: StepProps) {
  const selected = data.platforms;
  const canContinue = selected.length > 0;

  function toggle(value: string) {
    if (selected.includes(value)) {
      update({ platforms: selected.filter(v => v !== value) });
    } else {
      update({ platforms: [...selected, value] });
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 3 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿Dónde quieres crecer?</h1>
        <p className="text-white/50 text-base">
          Indica en dónde quieres ganar visibilidad o crecer audiencia. Puedes conectar tus cuentas después.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {PLATAFORMAS.map(p => {
          const isSelected = selected.includes(p.value);
          return (
            <button
              key={p.value}
              onClick={() => toggle(p.value)}
              className={`relative text-left px-4 py-4 rounded-2xl border transition-all duration-150 ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
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
              <div className="mb-2">
                <p.Icon size={24} weight="light" color={isSelected ? '#A855F7' : '#5C5A7A'} />
              </div>
              <p className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {p.label}
              </p>
              <p className="text-xs text-white/35 leading-relaxed">{p.sub}</p>
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
