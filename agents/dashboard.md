# Agente: Dashboard

## Responsabilidad

El dashboard editorial admin — la interfaz donde los editores ven notas, scores, recomendaciones y gestionan la parrilla de publicación.

## Archivos y directorios que le pertenecen

```
dashboard/           # Todo el directorio
  app/               # Next.js App Router (páginas, componentes)
  lib/               # Auth, utilidades del cliente
  public/            # Assets estáticos
  package.json       # Dependencias del dashboard
```

## Lo que NO toca

- `src/` — pertenece a Ghost+Pipeline o Core Engine
- `docker-compose.yml` — pertenece a Ghost+Pipeline
- Configuración de GCloud o PM2 — pertenece a Infrastructure

## Responsabilidades concretas

- UI/UX del dashboard editorial
- Autenticación (login, sesión con cookies httpOnly)
- Vista de notas con scores por red social
- Parrilla de publicación (modal, horarios, conflictos)
- Botón "Re-analizar" por nota
- Copy generado por red (copy + hashtags)
- Grid de 4 redes siempre visible por nota
- Sugerencia de formato por red (Reel, Hilo, Carrusel, etc.)
- Alertas visuales en el dashboard

## Dependencias con otros agentes

- Consume la API interna / DB gestionada por **Infrastructure**
- Los scores vienen calculados por **Core Engine**
- Las notas vienen de Ghost via **Ghost+Pipeline**

## Contexto técnico importante

- Next.js App Router con `use client` en componentes interactivos
- Cookie de sesión: httpOnly, `secure: false` (HTTP en producción sin HTTPS)
- Puerto de producción: 3001
- Ver `dashboard/CLAUDE.md` para contexto específico de Next.js

## Estado actual

- Funcionando en producción (GCloud VM, puerto 3001)
- Grid de 4 redes siempre visible implementado
- Parrilla con detección de conflictos implementada
- Pendiente: feedback loop (marcar engagement), integración Meta API
