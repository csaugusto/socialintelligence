/**
 * dashboard-config.js — Configuración personalizada del dashboard por workspace
 *
 * getDashboardConfig(workspace, profile) devuelve la configuración de:
 *   - KPIs a mostrar (labels, ícono, color)
 *   - Copy de bienvenida personalizado
 *   - Módulos destacados (orden en sidebar y secciones)
 *   - Acciones rápidas en home
 */

// ---------------------------------------------------------------------------
// KPIs disponibles — cada tipo de cuenta activa un subconjunto
// ---------------------------------------------------------------------------

const ALL_KPIS = {
  ideas_hoy: {
    key: 'ideas_hoy',
    label: 'Ideas para hoy',
    sublabel: 'Detectadas para tu nicho',
    color: 'purple',
    dataKey: 'ideasHoy',
  },
  en_produccion: {
    key: 'en_produccion',
    label: 'En producción',
    sublabel: 'Ideas activas en tu pipeline',
    color: 'blue',
    dataKey: 'enProduccion',
  },
  publicados_semana: {
    key: 'publicados_semana',
    label: 'Publicados esta semana',
    sublabel: 'Piezas listas o publicadas',
    color: 'green',
    dataKey: 'publicadosSemana',
  },
  oportunidades: {
    key: 'oportunidades',
    label: 'Oportunidades urgentes',
    sublabel: 'Caducan pronto o están en tendencia',
    color: 'pink',
    dataKey: 'oportunidades',
  },
  tendencias_nicho: {
    key: 'tendencias_nicho',
    label: 'Tendencias en tu nicho',
    sublabel: 'Señales activas detectadas',
    color: 'cyan',
    dataKey: 'tendenciasNicho',
  },
  competidores_activos: {
    key: 'competidores_activos',
    label: 'Competidores monitoreados',
    sublabel: 'Cuentas en seguimiento',
    color: 'blue',
    dataKey: 'competidoresActivos',
  },
  menciones: {
    key: 'menciones',
    label: 'Menciones detectadas',
    sublabel: 'Referencias a tu marca hoy',
    color: 'cyan',
    dataKey: 'menciones',
  },
  score_mix: {
    key: 'score_mix',
    label: 'Mix de contenido',
    sublabel: 'Equilibrio de tu parrilla',
    color: 'purple',
    dataKey: 'scoreMix',
  },
};

// ---------------------------------------------------------------------------
// Config por tipo de cuenta
// ---------------------------------------------------------------------------

const TYPE_CONFIG = {
  creator: {
    kpis: ['ideas_hoy', 'en_produccion', 'publicados_semana', 'oportunidades'],
    featuredModules: ['oportunidades', 'briefs', 'calendario', 'estrategia'],
    welcomeTitle: (name) => `Hola, ${name}`,
    emptyTitle: 'Tu primer brief te espera',
    emptyBody: 'El sistema está detectando oportunidades en tu nicho. En unos minutos tendrás ideas listas para ejecutar.',
  },
  brand: {
    kpis: ['ideas_hoy', 'tendencias_nicho', 'competidores_activos', 'oportunidades'],
    featuredModules: ['oportunidades', 'estrategia', 'calendario', 'briefs'],
    welcomeTitle: (name) => `Panel de ${name}`,
    emptyTitle: 'Tu radar de marca está activo',
    emptyBody: 'Monitoreando tendencias y movimientos de competencia en tu categoría.',
  },
  company: {
    kpis: ['ideas_hoy', 'en_produccion', 'publicados_semana', 'tendencias_nicho'],
    featuredModules: ['oportunidades', 'calendario', 'estrategia', 'briefs'],
    welcomeTitle: (name) => `Panel editorial — ${name}`,
    emptyTitle: 'El sistema está listo',
    emptyBody: 'Detectando oportunidades de contenido relevantes para tu empresa y sector.',
  },
  media: {
    kpis: ['ideas_hoy', 'oportunidades', 'publicados_semana', 'tendencias_nicho'],
    featuredModules: ['oportunidades', 'calendario', 'briefs', 'estrategia'],
    welcomeTitle: (name) => `Redacción — ${name}`,
    emptyTitle: 'Sin notas nuevas aún',
    emptyBody: 'El pipeline revisa tendencias cada 15 minutos. Las notas aparecerán aquí en cuanto se detecte algo publicable.',
  },
  agency: {
    kpis: ['ideas_hoy', 'competidores_activos', 'en_produccion', 'oportunidades'],
    featuredModules: ['oportunidades', 'estrategia', 'calendario', 'briefs'],
    welcomeTitle: (name) => `Agencia — ${name}`,
    emptyTitle: 'Panel de agencia listo',
    emptyBody: 'Agrega las marcas que gestionas y el sistema empezará a detectar oportunidades por cuenta.',
  },
};

// ---------------------------------------------------------------------------
// Subtítulo según objetivo principal
// ---------------------------------------------------------------------------

const OBJECTIVE_SUBTITLES = {
  'Crecer mi audiencia':         'Enfoque: crecimiento de seguidores y alcance',
  'Monetizar mi contenido':      'Enfoque: oportunidades de conversión y sponsorship',
  'Posicionarme como experto':   'Enfoque: autoridad de marca y visibilidad',
  'Generar leads o ventas':      'Enfoque: contenido que convierte',
  'Gestionar mi comunidad':      'Enfoque: engagement y retención de audiencia',
  'Cubrir noticias y tendencias':'Enfoque: velocidad editorial y cobertura',
  'Educar a mi audiencia':       'Enfoque: contenido educativo y didáctico',
};

// ---------------------------------------------------------------------------

/**
 * Devuelve la configuración personalizada del dashboard.
 *
 * @param {{ name: string, type: string }} workspace
 * @param {{ objectives?: string[] }} profile  — workspace_profiles row (puede ser null)
 * @returns {{
 *   welcomeTitle: string,
 *   welcomeSubtitle: string,
 *   kpis: object[],
 *   featuredModules: string[],
 *   emptyTitle: string,
 *   emptyBody: string,
 * }}
 */
function getDashboardConfig(workspace, profile) {
  const type = workspace?.type || 'creator';
  const name = workspace?.name || 'tu workspace';
  const objectives = profile?.objectives || [];

  const typeConf = TYPE_CONFIG[type] || TYPE_CONFIG.creator;

  // Título de bienvenida
  const welcomeTitle = typeConf.welcomeTitle(name);

  // Subtítulo: objetivo principal o genérico
  const primaryObjective = objectives[0] || null;
  const welcomeSubtitle = primaryObjective
    ? (OBJECTIVE_SUBTITLES[primaryObjective] || `Objetivo: ${primaryObjective}`)
    : 'Tu copiloto de contenido está listo';

  // KPIs resueltos
  const kpis = typeConf.kpis.map(k => ALL_KPIS[k]).filter(Boolean);

  return {
    welcomeTitle,
    welcomeSubtitle,
    kpis,
    featuredModules: typeConf.featuredModules,
    emptyTitle: typeConf.emptyTitle,
    emptyBody: typeConf.emptyBody,
  };
}

module.exports = { getDashboardConfig };
