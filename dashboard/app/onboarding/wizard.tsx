'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Step1Tipo from './steps/step1-tipo';
import Step2Objetivo from './steps/step2-objetivo';
import Step3Plataformas from './steps/step3-plataformas';
import Step4Cuentas from './steps/step4-cuentas';
import Step4Nicho from './steps/step4-nicho';
import Step5Pilares from './steps/step5-pilares';
import Step6Competencia from './steps/step6-competencia';
import Step7Ritmo from './steps/step7-ritmo';
import Step8Tono from './steps/step8-tono';
import Step9Resumen from './steps/step9-resumen';

export type Competitor = {
  handle: string;
  platform: string;
  label: 'competencia' | 'inspiracion' | 'benchmark' | 'referente';
  display_name?: string;
};

export type OnboardingData = {
  // Paso 1
  accountType: string;
  // Paso 2
  objectives: string[];
  // Paso 3
  platforms: string[];
  // Paso 4
  youtubeHandle: string;
  contentPatterns: Record<string, unknown> | null;
  // Paso 5
  nicho: string[];
  customNicho: string;
  // Paso 5
  pillars: string[];
  // Paso 6
  competitors: Competitor[];
  // Paso 7
  frequency: string;
  productionCapacity: string;
  // Paso 8
  tone: string;
  toneAvoid: string[];
  controversyLevel: number;
};

const EMPTY: OnboardingData = {
  accountType: '',
  objectives: [],
  platforms: [],
  youtubeHandle: '',
  contentPatterns: null,
  nicho: [],
  customNicho: '',
  pillars: [],
  competitors: [],
  frequency: '',
  productionCapacity: '',
  tone: '',
  toneAvoid: [],
  controversyLevel: 1,
};

const STEP_LABELS = [
  'Información básica',
  'Tu objetivo',
  'Plataformas',
  'Tu canal',
  'Tu nicho',
  'Pilares',
  'Competencia',
  'Ritmo',
  'Tono',
  'Resumen',
];

const TOTAL_STEPS = 10;

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [data, setData]   = useState<OnboardingData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [prefilling, setPrefilling] = useState(true);

  // Cargar perfil existente para pre-poblar el wizard
  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(existing => {
        if (existing && !existing.error) {
          setData(prev => ({ ...prev, ...existing }));
        }
      })
      .catch(() => {/* sin perfil previo, arranca vacío */})
      .finally(() => setPrefilling(false));
  }, []);

  function update(partial: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...partial }));
  }

  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)); }
  function prev() { setStep(s => Math.max(s - 1, 1)); }

  async function finish() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizard: true, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setSaving(false);
    }
  }

  async function skip() {
    router.push('/');
  }

  const stepProps = { data, update, onNext: next, onPrev: prev };

  if (prefilling) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header con steps */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Creator Intelligence" className="w-12 h-12" />
          <span className="text-sm font-semibold text-white">Creator Intelligence</span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                    style={
                      active ? {
                        background: '#7C3AED',
                        color: 'white',
                        boxShadow: '0 0 0 3px rgba(124,58,237,0.3), 0 0 24px rgba(124,58,237,0.9), 0 0 48px rgba(124,58,237,0.4)',
                      } : done ? {
                        background: '#7C3AED',
                        color: 'white',
                        boxShadow: '0 0 12px rgba(124,58,237,0.5)',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.25)',
                      }
                    }
                  >
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : n}
                  </div>
                  {active && (
                    <span className="text-[10px] font-medium whitespace-nowrap hidden lg:block"
                      style={{ color: '#A855F7' }}>
                      {label}
                    </span>
                  )}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className="w-8 h-px mb-4 transition-all duration-500"
                    style={{
                      background: done
                        ? 'linear-gradient(90deg, #7C3AED, #A855F7)'
                        : 'rgba(255,255,255,0.08)',
                      boxShadow: done ? '0 0 10px rgba(124,58,237,0.7)' : 'none',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Skip */}
        <button
          onClick={skip}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Salir
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
            background: '#7C3AED',
            boxShadow: '0 0 8px rgba(124,58,237,0.6)',
          }}
        />
      </div>

      {/* Contenido del paso */}
      <div className="flex items-start justify-center px-4 py-10 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-2xl">
          {step === 1 && <Step1Tipo {...stepProps} />}
          {step === 2 && <Step2Objetivo {...stepProps} />}
          {step === 3 && <Step3Plataformas {...stepProps} />}
          {step === 4 && <Step4Cuentas {...stepProps} />}
          {step === 5 && <Step4Nicho {...stepProps} />}
          {step === 6 && <Step5Pilares {...stepProps} />}
          {step === 7 && <Step6Competencia {...stepProps} />}
          {step === 8 && <Step7Ritmo {...stepProps} />}
          {step === 9 && <Step8Tono {...stepProps} />}
          {step === 10 && (
            <Step9Resumen
              data={data}
              onFinish={finish}
              onPrev={prev}
              saving={saving}
              error={error}
            />
          )}
        </div>
      </div>

      {/* Omitir */}
      {step < 10 && (
        <div className="text-center pb-8">
          <button
            onClick={skip}
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Omitir configuración inicial
          </button>
        </div>
      )}
    </div>
  );
}

// Props compartidas entre todos los pasos
export type StepProps = {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
};
