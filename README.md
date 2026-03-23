# Social Intelligence

Medio de noticias MX autogenerado con IA. Detecta tendencias, redacta notas, busca imágenes y las publica en Ghost automáticamente. Incluye un sistema de scoring que determina cuándo y en qué red social conviene publicar cada nota.

---

## Cómo funciona

```
[Google Trends MX]  ──┐
[NewsAPI]           ──►── Deduplicador ──► Groq (genera nota) ──► Unsplash (imagen)
                                                    │
                                             Ghost (publica)
                                                    │
                                           Scorer (IG / X / FB / TK)
                                                    │
                                         Dashboard admin (recomendaciones)
```

El cron corre cada 15 minutos. Solo genera una nota si hay un trend que no haya sido cubierto en las últimas 6 horas.

---

## Stack

| Pieza | Tecnología |
|-------|-----------|
| Sitio público | Ghost 5 |
| Pipeline | Node.js + node-cron |
| Generación de notas | Groq API (llama-3.3-70b-versatile) |
| Trends | Google Trends RSS (MX) + NewsAPI |
| Imágenes | Unsplash API |
| Dashboard admin | Next.js (en desarrollo) |
| Base de datos | PostgreSQL (in-memory en desarrollo) |
| Hosting | Google Cloud |

---

## Setup local

### Requisitos

- Node.js 20+
- Docker Desktop

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con las API keys:

| Variable | Dónde obtenerla |
|----------|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — gratuito |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) — gratuito |
| `UNSPLASH_ACCESS_KEY` | [unsplash.com/developers](https://unsplash.com/developers) — gratuito |
| `GHOST_ADMIN_API_KEY` | Ghost Admin → Settings → Integrations → Add custom integration |

### 3. Levantar Ghost

```bash
docker compose up -d
```

Ghost queda disponible en [http://localhost:2368](http://localhost:2368).
Completar el setup en [http://localhost:2368/ghost](http://localhost:2368/ghost).

### 4. Correr el pipeline

```bash
# Un solo ciclo
node src/pipeline.js

# Con watcher (desarrollo)
npm run dev

# Producción (cron cada 15 min)
npm start
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
```

---

## Scorer

Calcula dos scores (0–100) por cada red social (Instagram, X, Facebook, TikTok):

- **Score de Contenido** — qué tan buena es esta nota para esta red (categoría, formato, caducidad)
- **Score de Momento** — qué tan buen momento es para publicar ahora (hora, día, saturación de parrilla)

Umbrales de recomendación:

```
≥ 70  →  PUBLICAR
55–69 →  CONSIDERAR
35–54 →  ESPERAR
< 35  →  NO PUBLICAR
```

---

## Variables de entorno

Ver `.env.example` para la lista completa.
