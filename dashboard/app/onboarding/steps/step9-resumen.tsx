'use client';

import { OnboardingData } from '../wizard';

type Props = {
  data: OnboardingData;
  onFinish: () => void;
  onPrev: () => void;
  saving: boolean;
  error: string;
};

const ACCOUNT_LABELS: Record<string, string> = {
  creator: 'Creador de contenido',
  brand: 'Marca',
  company: 'Empresa / Corporativo',
  media: 'Medio de comunicación',
  agency: 'Agencia',
};

const CONTROVERSIA_LABELS: Record<number, string> = {
  0: 'Nada',
  1: 'Mínima',
  2: 'Moderada',
  3: 'Alta',
};

const TONO_LABELS: Record<string, string> = {
  profesional: 'Profesional',
  cercano: 'Cercano',
  directo: 'Directo',
  educativo: 'Educativo',
  inspirador: 'Inspirador',
  provocador: 'Provocador',
  humoristico: 'Humorístico',
  narrativo: 'Narrativo',
};

const FRECUENCIA_LABELS: Record<string, string> = {
  diario: 'Diario',
  '3-4x': '3–4 veces/semana',
  '1-2x': '1–2 veces/semana',
  semanal: '1 artículo semanal',
  recomendado: 'Que el sistema decida',
};

const CAPACIDAD_LABELS: Record<string, string> = {
  grabar_mucho: 'Puedo grabar mucho',
  poco_tiempo: 'Poco tiempo disponible',
  ideas_rapidas: 'Ideas rápidas',
  elaboradas: 'Piezas elaboradas',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 mb-3">
      <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function Tag({ label, variant = 'default' }: { label: string; variant?: 'default' | 'purple' | 'pink' }) {
  const cls = {
    default: 'bg-white/8 text-white/60 border-white/10',
    purple:  'bg-purple-600/15 text-purple-300 border-purple-500/30',
    pink:    'bg-pink-600/15 text-pink-300 border-pink-500/30',
  }[variant];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>{label}</span>
  );
}

export default function Step9Resumen({ data, onFinish, onPrev, saving, error }: Props) {
  return (
    <div>
      {/* Header celebratorio */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(124,58,237,0.4)]">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 4L17.5 10.5H22L18 16L19.5 22.5L14 20L8.5 22.5L10 16L6 10.5H10.5L14 4Z" fill="white"/>
          </svg>
        </div>
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 10 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">Tu copiloto está listo</h1>
        <p className="text-white/50 text-base">
          Revisa tu configuración. Siempre puedes ajustarla desde tu perfil.
        </p>
      </div>

      {/* Resumen */}
      <div className="mb-6">
        {/* Tipo + objetivos */}
        <Section title="Perfil">
          <div className="flex flex-wrap gap-2">
            {data.accountType && (
              <Tag label={ACCOUNT_LABELS[data.accountType] ?? data.accountType} variant="purple" />
            )}
            {data.objectives.map(o => (
              <Tag key={o} label={o} />
            ))}
          </div>
        </Section>

        {/* Plataformas + nicho */}
        <Section title="Plataformas y nicho">
          <div className="flex flex-wrap gap-2">
            {data.platforms.map(p => (
              <Tag key={p} label={p} variant="purple" />
            ))}
            {data.nicho.map(n => (
              <Tag key={n} label={n} />
            ))}
          </div>
        </Section>

        {/* Pilares */}
        {data.pillars.length > 0 && (
          <Section title="Pilares de contenido">
            <div className="flex flex-wrap gap-2">
              {data.pillars.map(p => (
                <Tag key={p} label={p} variant="purple" />
              ))}
            </div>
          </Section>
        )}

        {/* Competencia */}
        {data.competitors.length > 0 && (
          <Section title="Cuentas monitoreadas">
            <div className="flex flex-wrap gap-2">
              {data.competitors.map((c, i) => (
                <Tag key={i} label={c.display_name || c.handle} />
              ))}
            </div>
          </Section>
        )}

        {/* Ritmo */}
        <Section title="Ritmo de publicación">
          <div className="flex flex-wrap gap-2">
            {data.frequency && (
              <Tag label={FRECUENCIA_LABELS[data.frequency] ?? data.frequency} variant="purple" />
            )}
            {data.productionCapacity && (
              <Tag label={CAPACIDAD_LABELS[data.productionCapacity] ?? data.productionCapacity} />
            )}
          </div>
        </Section>

        {/* Tono */}
        <Section title="Voz y tono">
          <div className="flex flex-wrap gap-2 mb-2">
            {data.tone && (
              <Tag label={TONO_LABELS[data.tone] ?? data.tone} variant="purple" />
            )}
            <Tag label={`Controversia: ${CONTROVERSIA_LABELS[data.controversyLevel] ?? data.controversyLevel}`} />
          </div>
          {data.toneAvoid.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.toneAvoid.map(t => (
                <Tag key={t} label={`Evita: ${t}`} variant="pink" />
              ))}
            </div>
          )}
        </Section>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onPrev}
          disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-medium text-white/40 border border-white/8 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-30"
        >
          Atrás
        </button>
        <button
          onClick={onFinish}
          disabled={saving}
          className="btn-primary flex-1 py-4 rounded-2xl"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" strokeOpacity="0.3"/>
                <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Guardando...
            </span>
          ) : 'Comenzar a crear'}
        </button>
      </div>
    </div>
  );
}
