# Roadmap — Social Intelligence

## Objetivo estratégico

Convertir Social Intelligence en un **SaaS multi-tenant**: motor de decisión de contenido para medios digitales y creadores. Cada cliente tiene su propio scorer calibrado a su audiencia, sus redes y su identidad editorial.

Dos verticales sobre un mismo core:
- **Media Intelligence** — para medios, radios, portales de noticias
- **Creator Intelligence** — para influencers, marcas personales, equipos de contenido

---

## Hecho ✅

### Infraestructura y auth
| Qué | Detalle |
|-----|---------|
| Auth multi-tenant con JWT | `{userId, clientId, role}` — sesiones completamente aisladas por cliente |
| Roles: superadmin / admin / editor | Superadmin sin cliente propio, gestiona todos los clientes |
| Panel de administración | CRUD de clientes y usuarios, asignación de roles y vertical |
| DB schema multi-tenant | `clients`, `client_profiles`, `client_scorer_config`, `users`, `articles`, `parrilla` |
| PostgreSQL en producción | Corriendo en Docker, persistencia real |
| Producción (GCloud) | VM Debian 12, Ghost en Docker, dashboard en puerto 3001 |

### Core engine — Media Intelligence
| Qué | Detalle |
|-----|---------|
| Pipeline completo | Trends → Groq (llama-3.3-70b) → Scorer → Ghost. Cron cada 15 min |
| Scorer v2 | Subscores con etiquetas + Groq judgment contextual. `score(nota, trendContext, clientConfig)` |
| Scorer con clientConfig | Merge de overrides por cliente con defaults. Profile narrative en Groq judgment |
| Onboarding Media | Cuestionario de 4 secciones → `generateScorerConfig` + `generateProfileNarrative` |
| Fuentes de trends (media) | Google Trends MX + NewsAPI → deduplicación + filtro de keywords ya cubiertos |

### Dashboard — Media Intelligence
| Qué | Detalle |
|-----|---------|
| Panel editorial | Grid de 4 redes, scores de contenido y momento, leyenda de colores |
| Re-analizar | Recalcula scores de una nota sin regenerarla |
| Copy por red | Copy listo para copiar + hashtags, generado al crear la nota |
| Parrilla de publicación | Calendario con detección de conflictos de horario |
| Redirect a onboarding | Nuevos usuarios sin perfil se redirigen automáticamente |

### Creator Intelligence — MVP ✅
| Qué | Detalle |
|-----|---------|
| Vertical creator en DB | Columna `vertical` en `clients` — bifurca toda la experiencia |
| Onboarding creator | Nichos multi-select, formatos, redes, audiencia, frecuencia. Tema morado |
| Dashboard creator | Panel separado: nichos, red principal ★, stats, TikTok-first en grid |
| Pipeline creator | Sin Ghost. Evalúa hasta 5 trends, descarta los no relevantes al nicho |
| Generador de briefs creativos | Output: ángulo + gancho + desarrollo + cierre + tip de producción + fuentes |
| Scorer consciente del perfil | `buildCreatorConfig` — boost +12 en red principal, solo redes activas del creator |
| Panel de tendencias | "Ver tendencias" trae listado sin LLM. "Desarrollar →" genera brief para ese topic |
| Fuentes de trends (creator) | Google Trends MX (por categoría) + YouTube Trending (por nicho) + Reddit (por subreddits) |
| Contexto de tendencia visible | Cada idea muestra dónde fue detectada y con qué señal |
| Brief visible en dashboard | Sección colapsable con gancho, desarrollo, cierre, tip y fuentes clickeables |
| Editar perfil creator | `/perfil` — actualiza nichos, redes, frecuencia, audiencia sin repetir onboarding |

---

## En progreso / Pendiente inmediato

| Qué | Por qué |
|-----|---------|
| Discutir rol de Ghost | El vertical creator no necesita CMS — revisar si Ghost sigue en la arquitectura o solo aplica a media |
| Notificación de redes sociales | Banner en el dashboard creator si no ha conectado sus cuentas |
| Feedback loop manual | Editor/creator marca "funcionó / no funcionó" → ajusta pesos del scorer |

---

## Fase 1 — Con primeros clientes

Con usuarios reales en ambas verticales, estas mejoras se vuelven necesarias.

### Feedback loop
Creator o editor marca en el dashboard qué ideas funcionaron → esos datos ajustan los pesos del scorer para ese cliente.

Fases:
1. Entrada manual ("funcionó / no funcionó" por post o idea)
2. APIs de redes traen engagement real automáticamente
3. Re-calibración periódica del scorer con datos acumulados

### Fuentes adicionales para creator
- **Spotify Charts** — para creators de música y lifestyle (API pública)
- **Twitter/X trending** — señal complementaria (free tier limitado)
- **TikTok Creative Center** — en espera de aprobación de acceso oficial

### Bot de alertas — Telegram
Notificación a admins de medios cuando el pipeline detecta una nota urgente (ya calculado en `_judgment.notify`).

### Meta OAuth completo
Flujo OAuth real en lugar de token manual. Requiere app review de Meta (1-3 semanas).

### PM2 en producción
`ecosystem.config.js` con todos los procesos. Arranque automático al reiniciar servidor.

---

## Fase 2 — Crecimiento

### Publicación directa a redes
La parrilla hoy es una agenda de sugerencias. Al llegar la hora programada, el sistema publica solo.

Redes prioritarias:
- Meta Business API (FB + IG) — gratis
- X/Twitter — $100/mes, evaluar con ingresos reales

### Creator Intelligence — siguientes capas
- Historial de ideas por creator con métricas de rendimiento
- Sugerencias de series de contenido (no solo ideas aisladas)
- Detección de nichos emergentes antes de que exploten

### Scorer v3 — Agente con personalidad
| Fase | Cómo funciona |
|------|--------------|
| v1 | Identidad inyectada en cada prompt |
| v2 (hoy) | Profile narrative como system prompt en Groq judgment |
| v3 | Fine-tuning por cliente con historial real de decisiones |

El fine-tuning es viable cuando cada cliente tiene suficientes decisiones registradas. Es el nivel premium del SaaS.

---

## Riesgos a cuidar

- **Score opaco** — siempre mostrar el porqué, no solo el número
- **Mezclar medios y creators** — comparten motor, no deben sentirse como el mismo producto
- **Sobreprometer virales** — lo defendible: detectar oportunidad, recomendar con evidencia, aprender con resultados
- **Generación automática sin control** — la IA es copiloto, no piloto
- **Dependencia de APIs no oficiales** — Reddit y YouTube son estables; TikTok puede bloquearse sin aviso

---

## Arquitectura actual

```
┌──────────────────────────────────────────────────┐
│                 CORE PLATFORM                    │
│  trends ingestion · scoring engine (v2)          │
│  Groq judgment · feedback loop (pendiente)       │
│  DB multi-tenant · auth JWT                      │
└──────────────┬───────────────────────────────────┘
               │
      ┌─────────┴──────────┐
      ▼                    ▼
Media Intelligence    Creator Intelligence
✅ Producción          ✅ MVP listo
Ghost + pipeline      Pipeline sin Ghost
Dashboard editorial   Dashboard creator
Parrilla/calendario   Briefs creativos
                      Panel de tendencias
                      (YT + Google + Reddit)
```

Cada cliente tiene: `client_id` · `vertical` · `scorer_config` · `profile_narrative` · `users` · `articles` · `parrilla`
