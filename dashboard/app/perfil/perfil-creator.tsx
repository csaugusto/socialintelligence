'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type SocialAccount = {
  id: string;
  platform: string;
  username: string;
  channel_id: string;
  connection_type: string;
  last_synced_at: string | null;
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube:   'YouTube',
  instagram: 'Instagram',
  tiktok:    'TikTok',
  x:         'X / Twitter',
};

const PLATFORM_NOTES: Record<string, string> = {
  youtube:   'Ingresa tu @username o URL del canal',
  instagram: 'Análisis manual por ahora — OAuth próximamente',
  tiktok:    'OAuth próximamente — en espera de aprobación TikTok',
};

const AVAILABLE_PLATFORMS = ['youtube', 'instagram'];

const NICHOS = [
  { key: 'lifestyle',       label: 'Lifestyle' },
  { key: 'tecnologia',      label: 'Tecnología' },
  { key: 'entretenimiento', label: 'Entretenimiento' },
  { key: 'educacion',       label: 'Educación' },
  { key: 'fitness',         label: 'Fitness / Salud' },
  { key: 'finanzas',        label: 'Finanzas' },
  { key: 'gaming',          label: 'Gaming' },
  { key: 'moda',            label: 'Moda / Belleza' },
  { key: 'gastronomia',     label: 'Gastronomía' },
  { key: 'viajes',          label: 'Viajes' },
  { key: 'negocios',        label: 'Negocios / Emprendimiento' },
  { key: 'otro',            label: 'Otro' },
];

const REDES = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'x',         label: 'X / Twitter' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'facebook',  label: 'Facebook' },
  { key: 'linkedin',  label: 'LinkedIn' },
];

const FRECUENCIAS = [
  { value: 'diaria',     label: 'Diaria' },
  { value: '3-4/semana', label: '3–4 veces por semana' },
  { value: '1-2/semana', label: '1–2 veces por semana' },
  { value: 'quincenal',  label: 'Quincenal o menos' },
];

const RANGOS_EDAD = [
  { value: '13-17', label: '13–17 años' },
  { value: '18-24', label: '18–24 años' },
  { value: '25-34', label: '25–34 años' },
  { value: '35-44', label: '35–44 años' },
  { value: '45+',   label: '45 años o más' },
];

type Profile = {
  categories: string[];
  main_category: string;
  active_networks: string[];
  primary_network: string;
  produces_video: boolean;
  team_size: number;
  audience_age_range: string;
  editorial_schedule: { frequency?: string } | null;
};

export default function PerfilCreator({ profile }: { profile: Profile }) {
  const router = useRouter();

  const [nichos, setNichos]         = useState<string[]>(profile.categories || []);
  const [mainNicho, setMainNicho]   = useState(profile.main_category || '');
  const [redes, setRedes]           = useState<string[]>(profile.active_networks || []);
  const [primaryRed, setPrimaryRed] = useState(profile.primary_network || '');
  const [producesVideo, setProducesVideo] = useState(profile.produces_video || false);
  const [teamSize, setTeamSize]     = useState(String(profile.team_size || '1'));
  const [ageRange, setAgeRange]     = useState(profile.audience_age_range || '');
  const [frecuencia, setFrecuencia] = useState(profile.editorial_schedule?.frequency || '');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');

  // Cuentas sociales
  const [accounts, setAccounts]     = useState<SocialAccount[]>([]);
  const [newPlatform, setNewPlatform] = useState('youtube');
  const [newUsername, setNewUsername] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);
  const [analyzing, setAnalyzing]   = useState(false);
  type AnalysisResult = {
    top_topics?: string[];
    tone?: string;
    what_works?: string;
    recommended_duration?: string;
    [key: string]: unknown;
  };
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    fetch('/api/creator/accounts')
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []));
  }, []);

  async function handleAddAccount() {
    if (!newUsername.trim()) return;
    setAddingAccount(true);
    const res = await fetch('/api/creator/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: newPlatform, username: newUsername.trim() }),
    });
    if (res.ok) {
      const acc = await res.json();
      setAccounts(prev => [...prev.filter(a => a.platform !== acc.platform), acc]);
      setNewUsername('');
    }
    setAddingAccount(false);
  }

  async function handleDeleteAccount(platform: string) {
    await fetch('/api/creator/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    setAccounts(prev => prev.filter(a => a.platform !== platform));
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysisResult(null);
    const res = await fetch('/api/creator/analyze', { method: 'POST' });
    const data = await res.json();
    if (res.ok) setAnalysisResult(data.patterns);
    else setError(data.error || 'Error al analizar');
    setAnalyzing(false);
  }

  function toggleNicho(key: string) {
    setNichos(prev =>
      prev.includes(key) ? prev.filter(n => n !== key) : [...prev, key]
    );
    if (mainNicho === key) setMainNicho('');
  }

  function toggleRed(key: string) {
    setRedes(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    );
    if (primaryRed === key) setPrimaryRed('');
  }

  async function handleSave() {
    if (!mainNicho) { setError('Selecciona un nicho principal'); return; }
    if (!primaryRed) { setError('Selecciona una red principal'); return; }

    setSaving(true);
    setError('');

    const res = await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories:          nichos,
        main_category:       mainNicho,
        active_networks:     redes,
        primary_network:     primaryRed,
        produces_video:      producesVideo,
        team_size:           parseInt(teamSize) || 1,
        audience_age_range:  ageRange,
        editorial_schedule:  frecuencia ? { frequency: frecuencia } : null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(data.error || 'Error al guardar');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-purple-900/40 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Mi perfil</h1>
          <p className="text-xs text-purple-500">Configuración del creator</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Volver al dashboard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Nichos */}
        <section>
          <h2 className="text-sm font-semibold text-white mb-1">Tus nichos</h2>
          <p className="text-xs text-gray-500 mb-3">Selecciona todos los que apliquen</p>
          <div className="flex flex-wrap gap-2">
            {NICHOS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleNicho(key)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  nichos.includes(key)
                    ? 'bg-purple-800 border-purple-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Nicho principal */}
        {nichos.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-white mb-1">Nicho principal</h2>
            <p className="text-xs text-gray-500 mb-3">El que mejor te define</p>
            <div className="flex flex-wrap gap-2">
              {nichos.map(key => {
                const label = NICHOS.find(n => n.key === key)?.label || key;
                return (
                  <button
                    key={key}
                    onClick={() => setMainNicho(key)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      mainNicho === key
                        ? 'bg-purple-600 border-purple-400 text-white font-medium'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {mainNicho === key ? '★ ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Redes sociales */}
        <section>
          <h2 className="text-sm font-semibold text-white mb-1">Redes activas</h2>
          <p className="text-xs text-gray-500 mb-3">Donde publicas contenido</p>
          <div className="flex flex-wrap gap-2">
            {REDES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleRed(key)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  redes.includes(key)
                    ? 'bg-purple-800 border-purple-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Red principal */}
        {redes.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-white mb-1">Red principal</h2>
            <p className="text-xs text-gray-500 mb-3">Donde tiene más impacto tu contenido</p>
            <div className="flex flex-wrap gap-2">
              {redes.map(key => {
                const label = REDES.find(r => r.key === key)?.label || key;
                return (
                  <button
                    key={key}
                    onClick={() => setPrimaryRed(key)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      primaryRed === key
                        ? 'bg-purple-600 border-purple-400 text-white font-medium'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {primaryRed === key ? '★ ' : ''}{label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Frecuencia */}
        <section>
          <h2 className="text-sm font-semibold text-white mb-3">Frecuencia de publicación</h2>
          <div className="grid grid-cols-2 gap-2">
            {FRECUENCIAS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFrecuencia(value)}
                className={`text-sm px-3 py-2 rounded-lg border text-left transition-colors ${
                  frecuencia === value
                    ? 'bg-purple-800 border-purple-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Audiencia */}
        <section>
          <h2 className="text-sm font-semibold text-white mb-3">Rango de edad de tu audiencia</h2>
          <div className="flex flex-wrap gap-2">
            {RANGOS_EDAD.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAgeRange(value)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  ageRange === value
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Produce video + team */}
        <section className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">¿Produces video?</h2>
            <div className="flex gap-2">
              {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(({ v, l }) => (
                <button
                  key={String(v)}
                  onClick={() => setProducesVideo(v)}
                  className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                    producesVideo === v
                      ? 'bg-purple-800 border-purple-600 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Tamaño del equipo</h2>
            <input
              type="number"
              min="1"
              max="50"
              value={teamSize}
              onChange={e => setTeamSize(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </section>

        {/* Cuentas sociales */}
        <section className="border-t border-gray-800 pt-6">
          <h2 className="text-sm font-semibold text-white mb-1">Mis cuentas</h2>
          <p className="text-xs text-gray-500 mb-4">
            Conecta tus redes para analizar tu historial y generar ideas más personalizadas
          </p>

          {/* Cuentas conectadas */}
          {accounts.length > 0 && (
            <div className="space-y-2 mb-4">
              {accounts.map(acc => (
                <div key={acc.platform} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5">
                  <div>
                    <span className="text-sm text-white font-medium">{PLATFORM_LABELS[acc.platform] || acc.platform}</span>
                    <span className="text-xs text-gray-500 ml-2">{acc.username}</span>
                    {acc.connection_type === 'username' && (
                      <span className="text-xs text-yellow-600 ml-2">· acceso público</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(acc.platform)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar cuenta */}
          <div className="flex gap-2">
            <select
              value={newPlatform}
              onChange={e => setNewPlatform(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {AVAILABLE_PLATFORMS.map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder={newPlatform === 'youtube' ? '@tucanal' : '@tuusuario'}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              onKeyDown={e => e.key === 'Enter' && handleAddAccount()}
            />
            <button
              onClick={handleAddAccount}
              disabled={addingAccount || !newUsername.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white border border-gray-700 transition-colors whitespace-nowrap"
            >
              {addingAccount ? '...' : 'Agregar'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1.5">{PLATFORM_NOTES[newPlatform]}</p>

          {/* Botón analizar */}
          {accounts.length > 0 && (
            <div className="mt-4">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-2.5 rounded-lg bg-purple-800 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {analyzing ? 'Analizando tu contenido...' : '✦ Analizar mi contenido publicado'}
              </button>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Extrae patrones de tus mejores posts para personalizar las sugerencias
              </p>
            </div>
          )}

          {/* Resultado del análisis */}
          {analysisResult && (
            <div className="mt-4 bg-purple-950/30 border border-purple-800/40 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Análisis completado</p>
              {analysisResult.top_topics && (
                <p className="text-xs text-gray-300"><span className="text-gray-500">Temas top:</span> {(analysisResult.top_topics as string[]).join(', ')}</p>
              )}
              {analysisResult.tone && (
                <p className="text-xs text-gray-300"><span className="text-gray-500">Tono:</span> {analysisResult.tone as string}</p>
              )}
              {analysisResult.what_works && (
                <p className="text-xs text-gray-300"><span className="text-gray-500">Qué funciona:</span> {analysisResult.what_works as string}</p>
              )}
              {analysisResult.recommended_duration && (
                <p className="text-xs text-gray-300"><span className="text-gray-500">Duración ideal:</span> {analysisResult.recommended_duration as string}</p>
              )}
              <p className="text-xs text-purple-500 mt-2">Las próximas ideas generadas usarán estos patrones</p>
            </div>
          )}
        </section>

        <div className="pt-4 border-t border-gray-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {saving ? 'Guardando...' : saved ? '✓ Cambios guardados' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}
