import { useState } from 'react';
import {
  FilmSlateIcon,
  AirplaneIcon,
  SparkleIcon,
  MonitorIcon,
  BooksIcon,
  NewspaperIcon,
  StarIcon,
  TrendUpIcon,
  CurrencyDollarIcon,
  BarbellIcon,
  ForkKnifeIcon,
  TShirtIcon,
  GameControllerIcon,
  SoccerBallIcon,
  MusicNotesIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type NichoOption = {
  value: string;
  label: string;
  Icon: PhosphorIcon;
};

const NICHOS: NichoOption[] = [
  { value: 'entretenimiento', label: 'Entretenimiento', Icon: FilmSlateIcon },
  { value: 'viajes',          label: 'Viajes',          Icon: AirplaneIcon },
  { value: 'lifestyle',       label: 'Estilo de vida',  Icon: SparkleIcon },
  { value: 'tecnologia',      label: 'Tecnología',      Icon: MonitorIcon },
  { value: 'educacion',       label: 'Educación',       Icon: BooksIcon },
  { value: 'noticias',        label: 'Noticias',        Icon: NewspaperIcon },
  { value: 'pop_culture',     label: 'Cultura pop',     Icon: StarIcon },
  { value: 'negocios',        label: 'Negocios',        Icon: TrendUpIcon },
  { value: 'finanzas',        label: 'Finanzas',        Icon: CurrencyDollarIcon },
  { value: 'salud',           label: 'Salud y fitness', Icon: BarbellIcon },
  { value: 'gastronomia',     label: 'Gastronomía',     Icon: ForkKnifeIcon },
  { value: 'moda',            label: 'Moda / Belleza',  Icon: TShirtIcon },
  { value: 'gaming',          label: 'Gaming',          Icon: GameControllerIcon },
  { value: 'deportes',        label: 'Deportes',        Icon: SoccerBallIcon },
  { value: 'musica',          label: 'Música',          Icon: MusicNotesIcon },
];

export default function Step4Nicho({ data, update, onNext, onPrev }: StepProps) {
  const [search, setSearch] = useState('');
  const selected = data.nicho;
  const canContinue = selected.length > 0;

  const filtered = NICHOS.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(value: string) {
    if (selected.includes(value)) {
      update({ nicho: selected.filter(v => v !== value) });
    } else {
      update({ nicho: [...selected, value] });
    }
  }

  function addCustom() {
    const val = search.trim();
    if (!val || selected.includes(val)) return;
    update({ nicho: [...selected, val], customNicho: val });
    setSearch('');
  }

  const showAddCustom = search.trim() && !NICHOS.some(n => n.label.toLowerCase() === search.toLowerCase()) && !selected.includes(search.trim());

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 5 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">¿De qué trata tu contenido?</h1>
        <p className="text-white/50 text-base">
          Dinos cuál es tu tema principal para identificar ideas relevantes para ti.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Busca tu nicho..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/30 border border-white/8 bg-white/3 focus:outline-none focus:border-purple-500/60 transition-colors"
        />
        {showAddCustom && (
          <button
            onClick={addCustom}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            + Agregar &quot;{search.trim()}&quot;
          </button>
        )}
      </div>

      {/* Tags seleccionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map(v => {
            const nicho = NICHOS.find(n => n.value === v);
            return (
              <span
                key={v}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-600/20 border border-purple-500/40 text-purple-300 cursor-pointer hover:bg-purple-600/30 transition-colors"
                onClick={() => toggle(v)}
              >
                {nicho && <nicho.Icon size={12} weight="bold" color="currentColor" />}
                {nicho?.label || v}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            );
          })}
        </div>
      )}

      {/* Grid de nichos */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {filtered.map(n => {
          const isSelected = selected.includes(n.value);
          return (
            <button
              key={n.value}
              onClick={() => toggle(n.value)}
              className={`text-left px-3 py-3 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-600/10'
                  : 'border-white/8 bg-white/3 hover:border-purple-500/30 hover:bg-white/5'
              }`}
            >
              <div className="mb-1.5">
                <n.Icon size={20} weight="light" color={isSelected ? '#A855F7' : '#5C5A7A'} />
              </div>
              <p className={`text-xs font-medium leading-tight ${isSelected ? 'text-white' : 'text-white/60'}`}>
                {n.label}
              </p>
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
