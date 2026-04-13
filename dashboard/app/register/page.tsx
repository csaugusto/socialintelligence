'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (res.ok) {
      router.push('/onboarding');
    } else {
      setError(json.error || 'Error al crear la cuenta');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image src="/logo.png" alt="Creator Intelligence" width={96} height={96} />
          <span className="text-white font-semibold text-lg">Creator Intelligence</span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
          <p className="text-white/40 text-sm">Empieza gratis, sin tarjeta de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-white/40 font-medium mb-1.5">Tu nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Carlos Sánchez"
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 font-medium mb-1.5">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>

          <div className="pt-1">
            <label className="block text-xs text-white/40 font-medium mb-1.5">
              Tu primer workspace
            </label>
            <input
              type="text"
              value={form.workspaceName}
              onChange={e => set('workspaceName', e.target.value)}
              placeholder="Ej: TechLatam, Studio Norte, Mi Canal..."
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/8 bg-white/5 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
            <p className="text-xs text-white/25 mt-1.5">Tu marca, canal o empresa. Puedes crear más workspaces después.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" strokeOpacity="0.3"/>
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Creando cuenta...
              </span>
            ) : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
