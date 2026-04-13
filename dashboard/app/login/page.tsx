'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Columna izquierda — pitch ── */}
      <div className="hidden lg:flex flex-col justify-between w-[58%] px-14 py-10 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-4 z-10">
          <Image src="/logo.png" alt="Creator Intelligence" width={72} height={72} />
          <span className="text-3xl font-bold text-white">Creator Intelligence</span>
        </div>

        {/* Hero */}
        <div className="z-10 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#A855F7' }}>
            Panel de contenido
          </p>
          <h1 className="text-5xl font-bold text-white leading-tight mb-5">
            Tu copiloto para<br />
            <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              crecer orgánicamente
            </span>
          </h1>
          <p className="text-lg leading-relaxed mb-8" style={{ color: '#C4C2D4' }}>
            Descubre qué publicar, cómo ejecutarlo y qué te conviene priorizar para crecer más rápido en redes sociales o web.
          </p>

          <ul className="space-y-4">
            {[
              'Ideas accionables',
              'Inteligencia competitiva',
              'Crecimiento orgánico guiado',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(168,85,247,0.5)' }}>
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.5 7.5L8.5 2.5" stroke="#C084FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-base font-medium text-white">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs z-10" style={{ color: '#5C5A7A' }}>© 2026 Creator Intelligence</p>
      </div>

      {/* ── Columna derecha — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 border-l"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,4,20,0.6)' }}>

        {/* Logo mobile */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <Image src="/logo.png" alt="Creator Intelligence" width={36} height={36} />
          <span className="text-sm font-semibold text-white">Creator Intelligence</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-1">Inicia sesión</h2>
          <p className="text-sm mb-7" style={{ color: '#C4C2D4' }}>Bienvenido de nuevo</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#C4C2D4' }}>Email</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8.5" rx="1.5" stroke="#3A3858" strokeWidth="1.2"/>
                  <path d="M1 5L7 8.5L13 5" stroke="#3A3858" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#C4C2D4' }}>Contraseña</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2.5" y="6" width="9" height="6.5" rx="1.2" stroke="#3A3858" strokeWidth="1.2"/>
                  <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="#3A3858" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-medium text-sm mt-1 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" strokeOpacity="0.3"/>
                    <path d="M7 2a5 5 0 0 1 5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs" style={{ color: '#3A3858' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Social — próximamente */}
          <div className="space-y-2.5">
            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E0F0' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" fill="#A09EC0"/>
              </svg>
              Continuar con Google
            </button>
            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E0F0' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M0 0h7.5v7.5H0V0zm8.5 0H16v7.5H8.5V0zM0 8.5h7.5V16H0V8.5zm8.5 0H16V16H8.5V8.5z" fill="#A09EC0"/>
              </svg>
              Continuar con Microsoft
            </button>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#A09EC0' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="transition-colors" style={{ color: '#7C3AED' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A855F7')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7C3AED')}>
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
