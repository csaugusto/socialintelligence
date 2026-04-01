# Social Intelligence

Medio de noticias MX autogenerado con IA. Detecta tendencias, redacta notas, busca imágenes y las publica en Ghost automáticamente. Incluye un sistema de scoring que determina cuándo y en qué red social conviene publicar cada nota, y un dashboard editorial para gestionar la parrilla de publicación.

**Objetivo:** convertirse en un SaaS multi-medio para estaciones de radio, periódicos digitales y medios regionales en MX.

---

## Cómo funciona

```
[Google Trends MX]  ──┐
[NewsAPI]           ──►── Deduplicador ──► Groq (genera nota) ──► Unsplash (imagen)
                                                  │
                                           Ghost (publica)
                                                  │
                                     Scorer por red (IG / X / FB / TK)
                                                  │
                                    Dashboard admin (parrilla + recomendaciones)
```

El cron corre cada 15 minutos. Solo genera una nota si hay un trend que no haya sido cubierto en las últimas 6 horas.

---

## Estado actual

| Componente | Estado | Notas |
|------------|--------|-------|
| Pipeline (cron + generación) | Funcionando en producción | GCloud VM, Debian 12 |
| Ghost CMS | Funcionando en producción | Docker, puerto 2368 |
| Scorer | Funcionando | Calibrado con datos históricos de Enfoque Noticias |
| Dashboard admin | Funcionando en producción | Next.js, puerto 3001 |
| Base de datos | In-memory | PostgreSQL pendiente para producción |
| Publicación automática a redes | Pendiente | Ver ROADMAP |

**Servidor:** Google Cloud VM — e2-medium (2 vCPU / 4 GB), us-central1-c, Debian 12 Bookworm.

---

## Stack

| Pieza | Tecnología |
|-------|-----------|
| Sitio público | Ghost 5 (Docker) |
| Pipeline | Node.js + node-cron |
| Generación de notas | Groq API (llama-3.3-70b-versatile) |
| Trends | Google Trends RSS (MX) + NewsAPI |
| Imágenes | Unsplash API |
| Dashboard admin | Next.js (App Router) |
| Base de datos | In-memory en dev / PostgreSQL en producción |
| Hosting | Google Cloud Compute Engine |

---

## Setup local

### Requisitos

- Node.js 20+
- Docker Desktop

### 1. Instalar dependencias

```bash
npm install
cd dashboard && npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

| Variable | Dónde obtenerla |
|----------|----------------|
| `GROQ_API_KEY` | console.groq.com — gratuito |
| `NEWS_API_KEY` | newsapi.org — gratuito |
| `UNSPLASH_ACCESS_KEY` | unsplash.com/developers — gratuito |
| `GHOST_ADMIN_API_KEY` | Ghost Admin → Settings → Integrations → Add custom integration |

### 3. Levantar Ghost

```bash
docker compose up -d
```

Ghost queda disponible en `http://localhost:2368`.
Completar el setup en `http://localhost:2368/ghost`.

### 4. Correr el pipeline

```bash
# Un solo ciclo
node src/pipeline.js

# Producción (cron cada 15 min)
npm start
```

### 5. Correr el dashboard

```bash
cd dashboard
npm run dev        # desarrollo
PORT=3001 npm start  # producción
```

---

## Estructura

```
src/
├── trends/         # Fuentes de tendencias (Google Trends + NewsAPI)
├── generator/      # Generación de notas con Groq
├── images/         # Búsqueda de imágenes en Unsplash
├── scorer/         # Score de Contenido y Momento por red social
├── publisher/      # Publicación en Ghost via Admin API
├── db/             # Capa de datos (in-memory / PostgreSQL)
├── pipeline.js     # Orquestador del ciclo completo
└── index.js        # Entry point con cron

dashboard/
├── app/            # Next.js App Router
└── lib/            # Auth y utilidades
```

---

## Scorer

Calcula dos scores (0–100) por cada red social (Instagram, X, Facebook, TikTok):

- **Score de Contenido** — qué tan buena es esta nota para esta red (categoría, formato, caducidad)
- **Score de Momento** — qué tan buen momento es para publicar ahora (hora, día, saturación de parrilla)

Recomendaciones resultantes: `Sí, se sugiere publicar` / `Considerar` / `Esperar` / `No aplica`

---

## Variables de entorno

Ver `.env.example` para la lista completa.
