'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    section: null,
    items: [
      { href: '/',              icon: HomeIcon,        label: 'Inicio' },
      { href: '/oportunidades', icon: SparkleIcon,     label: 'Oportunidades' },
      { href: '/briefs',        icon: BriefIcon,       label: 'Briefs' },
    ],
  },
  {
    section: 'Producción',
    items: [
      { href: '/crear',         icon: PenIcon,         label: 'Crear' },
      { href: '/calendario',    icon: CalendarIcon,    label: 'Calendario' },
    ],
  },
  {
    section: 'Inteligencia',
    items: [
      { href: '/estrategia',    icon: StrategyIcon,    label: 'Estrategia' },
      { href: '/aprendizaje',   icon: LearnIcon,       label: 'Aprendizaje' },
    ],
  },
];

const BOTTOM = [
  { href: '/configuracion',   icon: SettingsIcon,    label: 'Configuración' },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r"
      style={{ background: 'rgba(10,9,28,0.80)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L9 5.5H12.5L9.5 8.5L10.5 12.5L7 10.5L3.5 12.5L4.5 8.5L1.5 5.5H5L7 1.5Z" fill="white"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight" style={{ fontFamily: 'var(--font-oxanium)' }}>Creator</p>
            <p className="text-xs leading-tight" style={{ color: '#5C5A7A', fontFamily: 'var(--font-oxanium)' }}>Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p className="text-[11px] font-medium uppercase tracking-wider px-2 mb-1.5" style={{ color: '#5C5A7A' }}>
                {group.section}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'text-white'
                        : 'hover:text-white/80 hover:bg-white/5'
                    }`}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))',
                      border: '1px solid rgba(124,58,237,0.3)',
                      color: '#fff',
                      fontFamily: 'var(--font-oxanium)',
                    } : { color: '#A09EC0', border: '1px solid transparent', fontFamily: 'var(--font-oxanium)' }}
                  >
                    <item.icon active={active} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t pt-3 space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {BOTTOM.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={active ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#fff',
              } : { color: '#A09EC0', border: '1px solid transparent' }}
            >
              <item.icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function SparkleIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <path d="M8 2L9.5 6.5H14L10.5 9.5L12 14L8 11L4 14L5.5 9.5L2 6.5H6.5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function BriefIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <rect x="2" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function PenIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <path d="M11 2.5a1.5 1.5 0 0 1 2.5 1.5L5 12.5 2 13.5l1-3L11 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function StrategyIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function LearnIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <path d="M2 5l6-3 6 3-6 3-6-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 5v5c0 1.1 2.7 2 6 2s6-.9 6-2V5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: active ? '#A855F7' : '#5C5A7A' }}>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
