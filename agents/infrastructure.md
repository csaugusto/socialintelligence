# Agente: Infrastructure

## Responsabilidad

La base que sostiene todo: base de datos, servidor en la nube, procesos persistentes, Docker y variables de entorno.

## Archivos y directorios que le pertenecen

```
src/db/              # Capa de datos (conexión, migraciones, schema)
docker-compose.yml   # Compartido con Ghost+Pipeline — coordinar cambios
.env / .env.example  # Variables de entorno
package.json (raíz)  # Dependencias del pipeline
```

## Lo que NO toca

- Lógica de negocio en `src/scorer/` — es del Core Engine
- Componentes del dashboard — son del Dashboard
- Prompts y generación de contenido — es de Ghost+Pipeline

## Responsabilidades concretas

- Base de datos: schema, migraciones, conexión PostgreSQL (producción) / in-memory (dev)
- Google Cloud VM: configuración, firewall, SSH, disco
- PM2: procesos persistentes del pipeline y dashboard
- Docker: Ghost + MySQL, actualización de imágenes
- Variables de entorno: qué existe, dónde va cada key
- Backups y monitoreo básico

## Servidor de producción

```
Proveedor:    Google Cloud Compute Engine
Zona:         us-central1-c
Máquina:      e2-medium (2 vCPU / 4 GB RAM)
SO:           Debian 12 Bookworm
Disco:        10 GB (atención: ~5.6 GB usados al arrancar el proyecto)
Puertos:      2368 (Ghost), 3001 (Dashboard) — abiertos vía firewall GCloud
```

## Procesos en producción

| Proceso | Comando | Puerto |
|---------|---------|--------|
| Ghost CMS | `docker compose up -d` | 2368 |
| Pipeline (cron) | `npm start` (via PM2 pendiente) | — |
| Dashboard | `PORT=3001 npm start` (via PM2 pendiente) | 3001 |

## Pendiente crítico

- **PM2**: pipeline y dashboard corren manualmente hoy. Si el servidor reinicia, se caen. Configurar PM2 con `ecosystem.config.js` para arranque automático.
- **PostgreSQL**: la DB es in-memory en producción actualmente. Los datos no persisten entre reinicios del pipeline. Migrar a PostgreSQL real.
- **Disco**: 10 GB es ajustado. Monitorear uso y evaluar expansión cuando supere 7 GB.

## Dependencias con otros agentes

- Provee la DB a **Core Engine** y **Ghost+Pipeline**
- El **Dashboard** depende de que los procesos estén corriendo
- Cambios en `docker-compose.yml` deben coordinarse con **Ghost+Pipeline**
