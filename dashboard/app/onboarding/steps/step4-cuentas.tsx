'use client';

import { useState } from 'react';
import { YoutubeLogoIcon, CheckCircleIcon, WarningCircleIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { StepProps } from '../wizard';

type AnalysisResult = {
  postCount: number;
  content_patterns: {
    top_topics?: string[];
    tone?: string;
    what_works?: string;
    best_platform?: string;
    recommended_duration?: string;
  };
};

export default function Step4Cuentas({ data, update, onNext, onPrev }: StepProps) {
  const [handle, setHandle]     = useState(data.youtubeHandle || '');

  // Si ya hay handle guardado y content_patterns, arrancar en estado éxito
  const hasExisting = !!(data.youtubeHandle && data.contentPatterns);
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>(hasExisting ? 'success' : 'idle');
  const [result, setResult]     = useState<AnalysisResult | null>(
    hasExisting ? { postCount: 0, content_patterns: data.contentPatterns as AnalysisResult['content_patterns'] } : null
  );
  const [errorMsg, setErrorMsg] = useState('');

  async function analyze() {
    const raw = handle.trim();
    if (!raw) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res  = await fetch('/api/creator/analyze-channel', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ handle: raw }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Error al analizar');

      setResult(json);
      setStatus('success');
      update({ youtubeHandle: raw, contentPatterns: json.content_patterns });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') analyze();
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-purple-400 text-sm font-medium mb-2">Paso 4 de 10</p>
        <h1 className="text-3xl font-bold text-white mb-3">Conecta tu canal de YouTube</h1>
        <p className="text-white/50 text-base">
          Analizamos tus videos para entender qué temas y formatos te funcionan.
          Así las ideas que te recomendamos serán mucho más precisas.
        </p>
      </div>

      {/* Input */}
      <div className="mb-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <YoutubeLogoIcon size={18} weight="fill" color="#FF0000" />
              <span className="text-white/30 text-sm">youtube.com/</span>
            </div>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="@tucanal"
              disabled={status === 'loading'}
              className="w-full pl-36 pr-4 py-4 rounded-xl text-sm text-white placeholder-white/25 border border-white/8 bg-white/3 focus:outline-none focus:border-purple-500/60 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            onClick={analyze}
            disabled={!handle.trim() || status === 'loading'}
            className="btn-primary px-6 py-4 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <SpinnerGapIcon size={16} className="animate-spin" />
                Analizando...
              </>
            ) : 'Analizar canal'}
          </button>
        </div>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 mb-4">
          <WarningCircleIcon size={18} weight="fill" color="#EF4444" className="mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Success */}
      {status === 'success' && result && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-500/10">
            <CheckCircleIcon size={18} weight="fill" color="#A855F7" />
            <span className="text-sm font-medium text-white">
              {result.postCount > 0
                ? `Canal analizado — ${result.postCount} videos revisados`
                : `Análisis guardado — ${handle}`}
            </span>
          </div>

          <div className="px-4 py-4 space-y-4">
            {result.content_patterns.top_topics?.length ? (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Temas que más te funcionan</p>
                <div className="flex flex-wrap gap-2">
                  {result.content_patterns.top_topics.map(t => (
                    <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-600/15 border border-purple-500/30 text-purple-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {result.content_patterns.tone && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tu tono</p>
                <p className="text-sm text-white/70">{result.content_patterns.tone}</p>
              </div>
            )}

            {result.content_patterns.what_works && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Lo que funciona en tu canal</p>
                <p className="text-sm text-white/70">{result.content_patterns.what_works}</p>
              </div>
            )}

            {result.content_patterns.recommended_duration && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Duración ideal</p>
                <p className="text-sm text-white/70">{result.content_patterns.recommended_duration}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      {status === 'idle' && (
        <p className="text-xs text-white/25 mb-6">
          Solo analizamos tu contenido público. No necesitamos contraseñas ni acceso a tu cuenta.
        </p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onPrev}
          className="px-6 py-3 rounded-xl text-sm font-medium text-white/40 border border-white/8 hover:text-white/70 hover:border-white/20 transition-all"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          className="btn-primary flex-1 py-4 rounded-2xl transition-all duration-150"
        >
          {status === 'success' ? 'Continuar' : 'Continuar sin conectar'}
        </button>
      </div>
    </div>
  );
}
