'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NICHOS = [
  { key: 'lifestyle',      label: 'Lifestyle' },
  { key: 'tecnologia',     label: 'Tecnología' },
  { key: 'entretenimiento',label: 'Entretenimiento' },
  { key: 'educacion',      label: 'Educación' },
  { key: 'fitness',        label: 'Fitness / Salud' },
  { key: 'finanzas',       label: 'Finanzas' },
  { key: 'gaming',         label: 'Gaming' },
  { key: 'moda',           label: 'Moda / Belleza' },
  { key: 'gastronomia',    label: 'Gastronomía' },
  { key: 'viajes',         label: 'Viajes' },
  { key: 'negocios',       label: 'Negocios / Emprendimiento' },
  { key: 'otro',           label: 'Otro' },
];

const FORMATOS = [
  { key: 'video_corto',  label: 'Video corto', sub: 'Reels / TikTok' },
  { key: 'video_largo',  label: 'Video largo', sub: 'YouTube' },
  { key: 'foto',         label: 'Foto / Carrusel', sub: 'Instagram / FB' },
  { key: 'texto',        label: 'Texto / Threads', sub: 'X / LinkedIn' },
  { key: 'audio',        label: 'Audio / Podcast', sub: 'Spotify / Apple' },
  { key: 'stories',      label: 'Stories', sub: 'IG / FB' },
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

const TAMANO_AUDIENCIA = [
  { value: 'nano',  label: 'Nano', sub: 'Menos de 10k' },
  { value: 'micro', label: 'Micro', sub: '10k – 100k' },
  { value: 'macro', label: 'Macro', sub: '100k – 1M' },
  { value: 'mega',  label: 'Mega', sub: 'Más de 1M' },
];

const RANGOS_EDAD = [
  { value: '13-17', label: '13–17 años' },
  { value: '18-24', label: '18–24 años' },
  { value: '25-34', label: '25–34 años' },
  { value: '35-44', label: '35–44 años' },
  { value: '45+',   label: '45 años o más' },
];

export default function OnboardingCreator() {
  const router = useRouter();

  // Sección 1 — El creador
  const [creatorName,    setCreatorName]    = useState('');
  const [nichos,         setNichos]         = useState<string[]>([]);
  const [mainNicho,      setMainNicho]      = useState('');

  // Sección 2 — Contenido
  const [formatos,       setFormatos]       = useState<string[]>([]);
  const [frecuencia,     setFrecuencia]     = useState('');
  const [teamSize,       setTeamSize]       = useState('1');

  // Sección 3 — Redes
  const [activeNetworks, setActiveNetworks] = useState<string[]>([]);
  const [primaryNetwork, setPrimaryNetwork] = useState('');

  // Sección 4 — Audiencia
  const [audienceSize,   setAudienceSize]   = useState('');
  const [audienceAge,    setAudienceAge]    = useState('');

  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [resultado, setResultado] = useState<{ profileNarrative: string } | null>(null);

  function toggleNicho(key: string) {
    setNichos(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }
  function toggleFormato(key: string) {
    setFormatos(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }
  function toggleNetwork(key: string) {
    setActiveNetworks(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResultado(null);

    if (!creatorName.trim())        { setError('Ingresa el nombre del creador o marca.'); return; }
    if (nichos.length === 0)        { setError('Selecciona al menos un nicho.'); return; }
    if (!mainNicho)                 { setError('Selecciona el nicho principal.'); return; }
    if (formatos.length === 0)      { setError('Selecciona al menos un formato.'); return; }
    if (!frecuencia)                { setError('Selecciona la frecuencia de publicación.'); return; }
    if (activeNetworks.length === 0){ setError('Selecciona al menos una red.'); return; }
    if (!primaryNetwork)            { setError('Selecciona la red principal.'); return; }
    if (!audienceSize)              { setError('Selecciona el tamaño de tu audiencia.'); return; }
    if (!audienceAge)               { setError('Selecciona el rango de edad principal.'); return; }

    setLoading(true);

    const body = {
      clientName:    creatorName.trim(),
      clientType:    'creator',
      clientCoverage:'digital',
      vertical:      'creator',
      answers: {
        nichos,
        main_nicho:       mainNicho,
        formatos,
        frecuencia,
        team_size:        parseInt(teamSize, 10),
        active_networks:  activeNetworks,
        primary_network:  primaryNetwork,
        audience_size:    audienceSize,
        audience_age_range: audienceAge,
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
        setResultado({ profileNarrative: data.profileNarrative });
        setTimeout(() => router.push('/'), 2000);
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Perfil configurado</h2>
          <p className="text-gray-400 text-sm mb-6">Tu estrategia editorial está lista. Redirigiendo al dashboard...</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Identidad del creador</p>
            <p className="text-sm text-gray-300 leading-relaxed">{resultado.profileNarrative}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs text-purple-400 uppercase tracking-widest mb-2">Creator Intelligence</p>
          <h1 className="text-2xl font-bold mb-2">Configura tu perfil</h1>
          <p className="text-gray-400 text-sm">En 4 pasos configuramos tu estrategia de contenido.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Sección 1 — El creador */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-800 pb-2">
              1. El creador
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Nombre del creador o marca</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                 
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Nichos que cubres</label>
                <div className="flex flex-wrap gap-2">
                  {NICHOS.map(({ key, label }) => (
                    <button
                      key={key} type="button"
                      onClick={() => toggleNicho(key)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        nichos.includes(key)
                          ? 'bg-purple-900 border-purple-600 text-purple-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
              {nichos.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Nicho principal</label>
                  <div className="flex flex-wrap gap-2">
                    {nichos.map(key => {
                      const n = NICHOS.find(n => n.key === key)!;
                      return (
                        <button
                          key={key} type="button"
                          onClick={() => setMainNicho(key)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            mainNicho === key
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >{n.label}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sección 2 — Contenido */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-800 pb-2">
              2. Contenido
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Formatos que produces</label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMATOS.map(({ key, label, sub }) => (
                    <button
                      key={key} type="button"
                      onClick={() => toggleFormato(key)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        formatos.includes(key)
                          ? 'bg-purple-900/50 border-purple-600 text-purple-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Frecuencia de publicación</label>
                <div className="grid grid-cols-2 gap-2">
                  {FRECUENCIAS.map(({ value, label }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setFrecuencia(value)}
                      className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                        frecuencia === value
                          ? 'bg-purple-900/50 border-purple-600 text-purple-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tamaño del equipo</label>
                <input
                  type="number" min="1" max="50"
                  value={teamSize}
                  onChange={e => setTeamSize(e.target.value)}
                  className="w-24 bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <span className="text-xs text-gray-600 ml-2">persona(s) produciendo contenido</span>
              </div>
            </div>
          </section>

          {/* Sección 3 — Redes */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-800 pb-2">
              3. Redes sociales
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Redes donde publicas</label>
                <div className="flex flex-wrap gap-2">
                  {REDES.map(({ key, label }) => (
                    <button
                      key={key} type="button"
                      onClick={() => toggleNetwork(key)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        activeNetworks.includes(key)
                          ? 'bg-purple-900 border-purple-600 text-purple-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
              {activeNetworks.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Red principal</label>
                  <div className="flex flex-wrap gap-2">
                    {activeNetworks.map(key => {
                      const r = REDES.find(r => r.key === key)!;
                      return (
                        <button
                          key={key} type="button"
                          onClick={() => setPrimaryNetwork(key)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            primaryNetwork === key
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >{r.label}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sección 4 — Audiencia */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 border-b border-gray-800 pb-2">
              4. Audiencia
            </h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Tamaño de tu audiencia</label>
                <div className="grid grid-cols-2 gap-2">
                  {TAMANO_AUDIENCIA.map(({ value, label, sub }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setAudienceSize(value)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        audienceSize === value
                          ? 'bg-purple-900/50 border-purple-600 text-purple-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Rango de edad principal</label>
                <div className="flex flex-wrap gap-2">
                  {RANGOS_EDAD.map(({ value, label }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setAudienceAge(value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        audienceAge === value
                          ? 'bg-purple-900 border-purple-600 text-purple-200'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? 'Configurando...' : 'Guardar perfil y entrar al dashboard →'}
          </button>
        </form>
      </div>
    </div>
  );
}
