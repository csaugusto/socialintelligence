# Agente: Ghost + Pipeline

## Responsabilidad

Todo lo relacionado con el CMS Ghost y el pipeline de generación/publicación de contenido.

## Archivos y directorios que le pertenecen

```
src/trends/          # Fuentes de tendencias (Google Trends + NewsAPI)
src/generator/       # Generación de notas con Groq
src/images/          # Búsqueda de imágenes (Unsplash)
src/publisher/       # Publicación en Ghost via Admin API
src/pipeline.js      # Orquestador del ciclo completo
src/index.js         # Entry point con cron
docker-compose.yml   # Ghost + MySQL
.env (secciones: GHOST_*, GROQ_*, NEWS_API_*, UNSPLASH_*)
```

## Lo que NO toca

- `src/scorer/` — pertenece al Core Engine
- `src/db/` — pertenece a Infrastructure
- `dashboard/` — pertenece al Dashboard
- Configuración de GCloud o PM2 — pertenece a Infrastructure

## Responsabilidades concretas

- Configuración y mantenimiento de Ghost (Docker, URL, SMTP, API keys)
- Pipeline de generación: trends → deduplicación → Groq → imagen → publicación
- Cron scheduling del pipeline
- Integración con Ghost Admin API (JWT, endpoints)
- Calidad del contenido generado (prompts, estructura de la nota)
- Bot de alertas Telegram (cuando se implemente) — vive aquí porque es output del pipeline

## Dependencias con otros agentes

- Consume el score calculado por **Core Engine** para decidir si notificar
- Escribe en la DB gestionada por **Infrastructure**
- El **Dashboard** lee las notas publicadas vía Ghost Content API

## Estado actual

- Pipeline funcionando en producción (GCloud VM)
- Ghost corriendo en Docker, puerto 2368
- Cron cada 15 minutos
- Pendiente: bot Telegram, SMTP configurado para invitaciones
