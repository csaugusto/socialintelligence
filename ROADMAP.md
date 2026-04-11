# Roadmap — Creator Co-Pilot

## Visión del producto

Un copiloto inteligente que ayuda a creadores, marcas, medios y community managers a saber qué publicar, por qué publicarlo, cómo ejecutarlo y dónde les conviene hacerlo.

**No es** un calendario, un buscador de tendencias ni una fábrica de copies.  
**Es** un sistema que cruza señales del mercado + contexto de cuenta + objetivos + competencia para generar recomendaciones accionables de crecimiento orgánico.

---

## Lo construido hasta hoy ✅

### Infraestructura y auth
- Auth multi-tenant con JWT — sesiones aisladas por cliente
- Panel superadmin — CRUD de clientes y usuarios, impersonación vía `?viewAs=`
- DB multi-tenant — `clients`, `client_profiles`, `users`, `articles`, `parrilla`, `workspaces`, `workspace_members`
- PostgreSQL en producción (Docker), dashboard en GCloud VM Debian 12
- Registro de usuarios con workspace inicial — transacción atómica (BEGIN/COMMIT/ROLLBACK)

### Core engine
- Pipeline Media: Trends → Groq → Scorer → Ghost. Cron cada 15 min
- Pipeline Creator: Google Trends + YouTube + Reddit → matcher IA → briefs creativos
- Scorer v2 con subscores, etiquetas y Groq judgment contextual
- `matcher.js` — cruza tendencias con content_patterns del creator via Groq (fit_score, fit_reason, angle_hint)

### Dashboard Creator — MVP
- Onboarding básico: nichos, plataformas, redes, frecuencia
- Análisis de contenido propio desde YouTube → extrae top_topics, tono, what_works
- Panel de tendencias con score de afinidad, "Por qué te sirve" y ángulo sugerido
- Generación de briefs: ángulo + gancho + desarrollo + cierre + tip de producción
- Badge "✓ Desarrollada" en tendencias ya trabajadas
- Perfil creator editable en `/perfil`
- Cuentas sociales con @username por red

### Dashboard Media — MVP
- Panel editorial con grid de 4 redes y scores
- Copy por red + hashtags
- Parrilla de publicación con detección de conflictos
- Re-analizar notas sin regenerarlas

---

## Diseño — Sistema visual ✅

> Base definida en `DESIGN.md`. Aplica a todo lo construido.

- [x] Sistema de diseño completo en DESIGN.md — paleta oscura/cósmica, espaciado, componentes
- [x] Tipografía: Oxanium (UI) + Geist Sans (contenido largo) — implementado en globals.css + layout
- [x] `font-size: 17px` en `html` — escala rem uniformemente ~6%
- [x] Botón primario `.btn-primary` — sólido `#7C3AED` con glow `box-shadow`, sin gradiente
- [x] Phosphor Icons v2.1 — reemplaza emojis en todo el onboarding (pasos 1–8)
- [x] Fondo animado — aurora/nebulosa CSS puro: 4 blobs radial + grid tenue + campo de estrellas + keyframes 18–28s
- [x] Sidebar y header semi-transparentes con `backdrop-blur` — el fondo se ve a través
- [x] Step indicator del wizard con glow (`box-shadow` triple capa en paso activo)
- [x] `cursor: pointer` global + `cursor: grab/grabbing` en elementos arrastrables

---

## Fase 1 — Fundación de identidad ✅

### 1.1 Modelo multiempresa ✅
- [x] Concepto de `workspace` — un usuario puede tener o pertenecer a varias marcas
- [x] Un workspace tiene: nombre, tipo (creador / marca / empresa / medio / agencia)
- [x] Migración al modelo de workspaces
- [x] Selector de workspace en el header del dashboard

### 1.2 Roles internos por workspace ✅
- [x] `owner`, `editor`, `creator`, `analyst`, `viewer` — definidos en DB y sesión
- [x] Permisos aplicados en rutas y acciones del dashboard

### 1.3 Onboarding — wizard 9 pasos ✅
- [x] Paso 1: Tipo de cuenta (creator / brand / company / media / agency) — con Phosphor Icons
- [x] Paso 2: ¿Qué quieres lograr? — objetivos en lenguaje natural
- [x] Paso 3: ¿Dónde quieres crecer? — selección de plataformas con iconos
- [x] Paso 4: ¿De qué trata tu contenido? — nicho + campo libre
- [x] Paso 5: Pilares de contenido — selección múltiple
- [x] Paso 6: ¿A quién observamos? — competidores con etiqueta + Phosphor Icons de plataforma
- [x] Paso 7: Ritmo de publicación + capacidad de producción — Phosphor Icons
- [x] Paso 8: Tono, temas a evitar, nivel de polémica
- [x] Paso 9: Resumen estratégico — "Tu copiloto ya está listo"
- [x] Datos guardados vía `/api/onboarding` en DB

### 1.4 Perfil IA + Personalización del dashboard ← SIGUIENTE
> Objetivo: que la IA conozca al usuario desde el primer brief, y que el dashboard se adapte a su tipo de cuenta y objetivos.

**Perfil IA:**
- [ ] Columna `ai_profile TEXT` en tabla `workspaces`
- [ ] Función `buildUserProfile(onboardingData)` → string estructurado en lenguaje natural
- [ ] Al completar onboarding: compilar y guardar `ai_profile` en el workspace
- [ ] Al actualizar configuración (Workspace / Redes): regenerar `ai_profile`
- [ ] Función `buildSystemPrompt(workspace)` — devuelve el prefijo de sistema para cualquier llamada IA
- [ ] Aplicar en todos los endpoints que llaman a Groq/Claude

**Dashboard personalizado:**
- [ ] Leer `accountType` + `objectives` del workspace en el layout del shell
- [ ] `getDashboardConfig(workspace)` → { kpis, welcomeCopy, featuredModules }
- [ ] Pantalla Inicio: KPIs y módulos destacados según tipo de cuenta
  - Creator → engagement, seguidores, ideas ejecutadas
  - Brand → share of voice, menciones, conversión
  - Media → artículos publicados, velocidad, tendencias captadas
- [ ] Copy de bienvenida personalizado según objetivo principal
- [ ] Módulos reordenados según `objectives` (monetización / autoridad / crecimiento / ventas)

---

## Fase 2 — Estructura de navegación ✅ (parcial)

### 2.1 Sidebar + rutas ✅
- [x] Sidebar con navegación: Inicio, Oportunidades, Briefs, Crear, Calendario, Estrategia, Aprendizaje, Configuración
- [x] Rutas en Next.js para cada sección bajo `(shell)`
- [x] Estado activo en sidebar según ruta actual
- [x] Header sticky con workspace switcher

### 2.2 Pantalla: Inicio
- [ ] KPI cards personalizadas por tipo de cuenta (Fase 1.4)
- [ ] Módulo "Qué te conviene publicar hoy"
- [ ] Módulo "Lo que está funcionando en tu categoría"
- [ ] Módulo "Tu mezcla de contenido esta semana"

### 2.3 Pantalla: Oportunidades
- [ ] Feed de ideas con filtros laterales (canal, urgencia, dificultad, objetivo, fuente)
- [ ] Cards con: título, ángulo, origen de señal, score, mejor canal, vida útil, esfuerzo
- [ ] Acciones por card: Ver brief, Guardar, Descartar, Pasar a calendario
- [ ] Vistas: grid, lista, compacta, por canal, por urgencia

### 2.4 Pantalla: Detalle de Idea / Brief
- [ ] Encabezado con score, estado, fuente, urgencia
- [ ] Bloque "¿Por qué esta idea vale la pena?" — qué está pasando, por qué importa, por qué encaja
- [ ] Bloque "Cómo te conviene abordarla" — ángulo, tono, formato, CTA
- [ ] Bloque "Versiones sugeridas" — tabs por plataforma
- [ ] Bloque "Ventaja competitiva" — quién ya lo tocó, qué oportunidad queda libre
- [ ] Botones: Generar guion, Generar caption, Generar artículo, Pasar a calendario

### 2.5 Pantalla: Configuración ✅
- [x] Tab Workspace: nombre editable, tipo de cuenta, rol del usuario
- [x] Tab Redes sociales: conectar/desconectar 9 plataformas

---

## Fase 3 — Producción de contenido

### 3.1 Content Studio
- [ ] Editor limpio (estilo Notion + IA) accesible desde cualquier brief
- [ ] Tabs: Guion, Hook, Caption, CTA, Artículo, SEO, Variantes
- [ ] Acciones de refinamiento: más corto, más viral, más experto, más emocional, adaptar a otra red
- [ ] Convertir en artículo / convertir en carrusel
- [ ] *Requiere Fase 1.4 completa — el perfil IA alimenta la generación*

### 3.2 Calendario / Pipeline ✅
- [x] Vista calendario semanal con drag & drop
- [x] Kanban: detectada → validada → brief listo → en creación → revisando → aprobada → programada → publicada
- [x] "Rutina sugerida" — mezcla semanal recomendada
- [x] Persistencia en localStorage
- [ ] Huecos en el calendario con sugerencias de contenido (Fase 4)
- [ ] Sincronización con DB (actualmente solo localStorage)

---

## Fase 4 — Inteligencia competitiva y aprendizaje

### 4.1 Monitor de competidores
- [ ] El sistema detecta temas que está cubriendo la competencia, formatos dominantes, gaps
- [ ] "Oportunidades de counter-programming" — temas que la competencia no toca
- [ ] *Usa los competidores capturados en Paso 6 del onboarding*

### 4.2 Pantalla: Estrategia
- [ ] Objetivo principal editable
- [ ] Pilares de contenido editables
- [ ] Competidores/referencias monitoreados con métricas
- [ ] Ritmo recomendado y mix sugerido visual
- [ ] Qué reforzar, qué estás descuidando, qué estás saturando

### 4.3 Feedback loop
- [ ] Creator marca "funcionó / no funcionó" por idea publicada
- [ ] Esos datos ajustan pesos del scorer para ese workspace
- [ ] (Fase posterior) APIs de redes traen engagement real automáticamente

### 4.4 Pantalla: Aprendizaje
- [ ] Qué temas, formatos, canales y estilos funcionan mejor para esta cuenta
- [ ] Insights en lenguaje natural: "Tus reels cortos superan a tus carruseles en descubrimiento"
- [ ] Qué tipo de contenido le falta al mix actual

---

## Fase 5 — Escala y automatización
> Para cuando haya usuarios reales y revenue validado.

- [ ] Publicación directa a redes (Meta Business API, X/Twitter)
- [ ] Reporting profundo por cliente / workspace
- [ ] Notificaciones / alertas (Telegram, email) para oportunidades urgentes
- [ ] Scorer v3 — fine-tuning por workspace con historial real de decisiones
- [ ] TikTok Creative Center (pendiente aprobación de API oficial)
- [ ] Nginx como reverse proxy — dashboard en puerto 80/443

---

## Pendiente de decisión

| Tema | Detalle |
|------|---------|
| Rol de Ghost en el stack | El vertical creator no necesita CMS. Revisar si Ghost sigue en la arquitectura o solo aplica a Media. |
| Nombre del producto | El doc menciona "AudienceOS Creator". Definir si aplica o se mantiene "Social Intelligence". |
| Modelo de pricing | Freemium, por workspace, por usuario o por funcionalidad. Impacta diseño de roles y límites. |
| Sincronización calendario con DB | El kanban actualmente vive en localStorage. Decidir cuándo moverlo a DB. |

---

## Riesgos a cuidar

- **Score opaco** — siempre mostrar el porqué, no solo el número
- **Mezclar medios y creators** — comparten motor, no deben sentirse como el mismo producto
- **Sobreprometer virales** — lo defendible: detectar oportunidad, recomendar con evidencia, aprender con resultados
- **La IA es copiloto, no piloto** — el usuario toma la decisión final siempre
- **Dependencia de APIs no oficiales** — Reddit y YouTube son estables; TikTok puede bloquearse sin aviso
- **Perfil IA desactualizado** — regenerar `ai_profile` cuando el usuario edite su configuración, no solo al onboarding
