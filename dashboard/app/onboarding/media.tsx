'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIAS = [
  { key: 'politica',        label: 'Política' },
  { key: 'economia',        label: 'Economía' },
  { key: 'seguridad',       label: 'Seguridad' },
  { key: 'deportes',        label: 'Deportes' },
  { key: 'entretenimiento', label: 'Entretenimiento' },
  { key: 'tecnologia',      label: 'Tecnología' },
  { key: 'salud',           label: 'Salud' },
  { key: 'cultura',         label: 'Cultura' },
  { key: 'internacional',   label: 'Internacional' },
];

const REDES = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'x',         label: 'X / Twitter' },
  { key: 'facebook',  label: 'Facebook' },
  { key: 'tiktok',    label: 'TikTok' },
];

const TIPOS_MEDIO = [
  { value: 'radio',   label: 'Radio' },
  { value: 'tv',      label: 'TV' },
  { value: 'digital', label: 'Digital' },
  { value: 'portal',  label: 'Portal' },
  { value: 'revista', label: 'Revista' },
  { value: 'otro',    label: 'Otro' },
];

const COBERTURAS = [
  { value: 'nacional',  label: 'Nacional' },
  { value: 'regional',  label: 'Regional' },
  { value: 'local',     label: 'Local' },
];

const RANGOS_EDAD = [
  { value: '18-24', label: '18–24 años' },
  { value: '25-34', label: '25–34 años' },
  { value: '35-44', label: '35–44 años' },
  { value: '45-54', label: '45–54 años' },
  { value: '55+',   label: '55 años o más' },
];

const RED_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  x:         'X / Twitter',
  facebook:  'Facebook',
  tiktok:    'TikTok',
};

type ScorerConfig = {
  enabled_networks?: string[];
  category_weights?: Record<string, number[]>;
  production_time?: Record<string, number>;
  [key: string]: unknown;
};

type ResultadoOnboarding = {
  profileNarrative: string;
  scorerConfig: ScorerConfig;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
      {children}
    </h2>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm text-gray-300 mb-1.5">{children}</label>
  );
}

function inputClass(extra = '') {
  return `w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${extra}`;
}

export default function OnboardingMedia() {
  const router = useRouter();
  // Sección 1 — El medio
  const [clientName,     setClientName]     = useState('');
  const [clientType,     setClientType]     = useState('');
  const [clientCoverage, setClientCoverage] = useState('');
  const [clientRegion,   setClientRegion]   = useState('');

  // Sección 2 — Contenido
  const [categories,     setCategories]     = useState<string[]>([]);
  const [mainCategory,   setMainCategory]   = useState('');
  const [producesVideo,  setProducesVideo]  = useState(false);
  const [coversBreaking, setCoversBreaking] = useState(false);

  // Sección 3 — Redes
  const [activeNetworks,  setActiveNetworks]  = useState<string[]>([]);
  const [primaryNetwork,  setPrimaryNetwork]  = useState('');

  // Sección 4 — Equipo y audiencia
  const [scheduleStart,    setScheduleStart]    = useState('07:00');
  const [scheduleEnd,      setScheduleEnd]      = useState('22:00');
  const [teamSize,         setTeamSize]         = useState('');
  const [audienceAgeRange, setAudienceAgeRange] = useState('');

  // Estado del envío
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [resultado,  setResultado]  = useState<ResultadoOnboarding | null>(null);

  function toggleCategoria(key: string) {
    setCategories(prev => {
      const next = prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key];
      // Si la categoría principal ya no está seleccionada, resetear
      if (mainCategory && !next.includes(mainCategory)) setMainCategory('');
      return next;
    });
  }

  function toggleRed(key: string) {
    setActiveNetworks(prev => {
      const next = prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key];
      if (primaryNetwork && !next.includes(primaryNetwork)) setPrimaryNetwork('');
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResultado(null);

    if (!clientName.trim()) { setError('Ingresa el nombre del medio.'); return; }
    if (!clientType)        { setError('Selecciona el tipo de medio.'); return; }
    if (!clientCoverage)    { setError('Selecciona la cobertura.'); return; }
    if (categories.length === 0) { setError('Selecciona al menos una categoría.'); return; }
    if (!mainCategory)      { setError('Selecciona la categoría principal.'); return; }
    if (activeNetworks.length === 0) { setError('Selecciona al menos una red.'); return; }
    if (!primaryNetwork)    { setError('Selecciona la red principal.'); return; }
    if (!teamSize || parseInt(teamSize, 10) < 1) { setError('Ingresa el tamaño del equipo.'); return; }
    if (!audienceAgeRange)  { setError('Selecciona el rango de edad principal.'); return; }

    setLoading(true);

    const body = {
      clientName:     clientName.trim(),
      clientType,
      clientCoverage,
      clientRegion:   clientRegion.trim() || undefined,
      answers: {
        categories,
        main_category:      mainCategory,
        produces_video:     producesVideo,
        covers_breaking:    coversBreaking,
        active_networks:    activeNetworks,
        primary_network:    primaryNetwork,
        editorial_schedule: {
          start: scheduleStart,
          end:   scheduleEnd,
          days:  [1, 2, 3, 4, 5],
        },
        team_size:          parseInt(teamSize, 10),
        audience_age_range: audienceAgeRange,
        known_peak_hours:   null,
      },
    };

    try {
      const res  = await fetch('/api/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Error al procesar la configuración.');
      } else {
        setResultado({ profileNarrative: data.profileNarrative, scorerConfig: data.scorerConfig });
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => router.push('/'), 2000);
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-gray-950 z-10">
        <h1 className="text-lg font-bold tracking-tight">Creator Intelligence</h1>
        <p className="text-xs text-gray-500">Configuracion de nuevo cliente</p>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Seccion 1 — El medio */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <SectionTitle>El medio</SectionTitle>
            <div className="space-y-4">

              <div>
                <Label>Nombre del medio</Label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                 
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <select
                  value={clientType}
                  onChange={e => setClientType(e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Seleccionar...</option>
                  {TIPOS_MEDIO.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Cobertura</Label>
                <select
                  value={clientCoverage}
                  onChange={e => setClientCoverage(e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Seleccionar...</option>
                  {COBERTURAS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Ciudad / Region (opcional)</Label>
                <input
                  type="text"
                  value={clientRegion}
                  onChange={e => setClientRegion(e.target.value)}
                 
                  className={inputClass()}
                />
              </div>

            </div>
          </div>

          {/* Seccion 2 — Contenido */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <SectionTitle>Contenido</SectionTitle>
            <div className="space-y-5">

              <div>
                <Label>Categorias que cubres</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CATEGORIAS.map(cat => (
                    <label
                      key={cat.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        categories.includes(cat.key)
                          ? 'bg-blue-900 border-blue-600 text-blue-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={categories.includes(cat.key)}
                        onChange={() => toggleCategoria(cat.key)}
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Categoria principal</Label>
                <select
                  value={mainCategory}
                  onChange={e => setMainCategory(e.target.value)}
                  className={inputClass()}
                  disabled={categories.length === 0}
                >
                  <option value="">
                    {categories.length === 0 ? 'Primero selecciona categorias...' : 'Seleccionar...'}
                  </option>
                  {CATEGORIAS.filter(c => categories.includes(c.key)).map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setProducesVideo(v => !v)}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${
                      producesVideo ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${
                      producesVideo ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Produces video propio
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setCoversBreaking(v => !v)}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${
                      coversBreaking ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${
                      coversBreaking ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Cubres noticias de ultima hora
                  </span>
                </label>
              </div>

            </div>
          </div>

          {/* Seccion 3 — Redes */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <SectionTitle>Redes sociales</SectionTitle>
            <div className="space-y-5">

              <div>
                <Label>Redes activas</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {REDES.map(red => (
                    <label
                      key={red.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        activeNetworks.includes(red.key)
                          ? 'bg-blue-900 border-blue-600 text-blue-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activeNetworks.includes(red.key)}
                        onChange={() => toggleRed(red.key)}
                      />
                      {red.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Red principal</Label>
                <select
                  value={primaryNetwork}
                  onChange={e => setPrimaryNetwork(e.target.value)}
                  className={inputClass()}
                  disabled={activeNetworks.length === 0}
                >
                  <option value="">
                    {activeNetworks.length === 0 ? 'Primero selecciona redes...' : 'Seleccionar...'}
                  </option>
                  {activeNetworks.map(r => (
                    <option key={r} value={r}>{RED_LABELS[r] || r}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Seccion 4 — Equipo y audiencia */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <SectionTitle>Equipo y audiencia</SectionTitle>
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Inicio horario editorial</Label>
                  <input
                    type="time"
                    value={scheduleStart}
                    onChange={e => setScheduleStart(e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <Label>Fin horario editorial</Label>
                  <input
                    type="time"
                    value={scheduleEnd}
                    onChange={e => setScheduleEnd(e.target.value)}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div>
                <Label>Tamano del equipo de redes</Label>
                <input
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={e => setTeamSize(e.target.value)}
                 
                  className={inputClass()}
                />
              </div>

              <div>
                <Label>Rango de edad principal de la audiencia</Label>
                <select
                  value={audienceAgeRange}
                  onChange={e => setAudienceAgeRange(e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Seleccionar...</option>
                  {RANGOS_EDAD.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Generando configuracion...' : 'Generar configuracion'}
          </button>

        </form>

        {/* Resultado */}
        {resultado && (
          <div className="mt-8 space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Perfil editorial generado
              </h3>
              <p className="text-sm text-gray-200 leading-relaxed">{resultado.profileNarrative}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Resumen del scorer
              </h3>
              <div className="space-y-2 text-sm">
                {resultado.scorerConfig.enabled_networks && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-28">Redes activas:</span>
                    <span className="text-gray-200">
                      {resultado.scorerConfig.enabled_networks.map(r => RED_LABELS[r] || r).join(', ')}
                    </span>
                  </div>
                )}
                {resultado.scorerConfig.category_weights && mainCategory && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-28">Categoria boosteada:</span>
                    <span className="text-gray-200">
                      {CATEGORIAS.find(c => c.key === mainCategory)?.label || mainCategory}
                    </span>
                  </div>
                )}
                {resultado.scorerConfig.production_time && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-28">Tiempo produccion:</span>
                    <span className="text-gray-200">
                      IG {(resultado.scorerConfig.production_time as Record<string, number>).instagram}min — TK {(resultado.scorerConfig.production_time as Record<string, number>).tiktok}min
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
