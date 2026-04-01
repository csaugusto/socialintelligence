-- Social Intelligence — PostgreSQL Schema
-- Ejecutar en una DB vacía: psql $DATABASE_URL -f src/db/schema.sql
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- CLIENTS — el medio como entidad
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,  -- para routing: /dashboard/enfoque
  type       VARCHAR(50)  NOT NULL,          -- radio, tv, digital, portal, revista, otro
  coverage   VARCHAR(50)  NOT NULL,          -- nacional, regional, local
  region     VARCHAR(100),                   -- ciudad o estado (si aplica)
  vertical   VARCHAR(20) NOT NULL DEFAULT 'media',  -- media | creator
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cliente por defecto para modo single-tenant (retrocompatibilidad)
INSERT INTO clients (id, name, slug, type, coverage)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default', 'digital', 'nacional')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CLIENT PROFILES — respuestas del cuestionario de onboarding
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          UUID REFERENCES clients(id) ON DELETE CASCADE,
  -- Contenido
  categories         TEXT[],       -- categorías que cubre el medio
  main_category      VARCHAR(50),  -- categoría estrella
  produces_video     BOOLEAN DEFAULT FALSE,
  covers_breaking    BOOLEAN DEFAULT FALSE,
  -- Redes
  active_networks    TEXT[],       -- redes que usa actualmente
  primary_network    VARCHAR(50),  -- red principal
  -- Equipo
  editorial_schedule JSONB,        -- { start: "07:00", end: "22:00", days: [1,2,3,4,5] }
  team_size          INTEGER,
  -- Audiencia
  audience_age_range VARCHAR(50),  -- "18-34", "35-54", etc.
  known_peak_hours   JSONB,        -- { instagram: [11, 19], x: [9, 17] } o null si no conoce
  -- Perfil narrativo para Groq (generado automáticamente del cuestionario)
  profile_narrative  TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- CLIENT SCORER CONFIG — overrides numéricos generados por reglas
-- Se fusiona con los defaults del scorer. Solo se guardan los valores que difieren.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_scorer_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID REFERENCES clients(id) ON DELETE CASCADE,
  category_weights JSONB,   -- overrides parciales de CATEGORY_WEIGHTS
  hour_factors     JSONB,   -- si el cliente conoce sus picos propios
  day_multipliers  JSONB,
  format_signals   JSONB,
  production_time  JSONB,   -- { instagram: 20, x: 2, facebook: 15, tiktok: 120 }
  enabled_networks TEXT[],  -- redes activas (las inactivas no se scorean)
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- USERS — editores y admins, uno por cliente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'editor',  -- editor, admin
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- ARTICLES — notas generadas por el pipeline, una por cliente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title         TEXT NOT NULL,
  excerpt       TEXT,
  category      VARCHAR(50),
  decay_type    VARCHAR(20),
  is_breaking   BOOLEAN DEFAULT FALSE,
  has_video     BOOLEAN DEFAULT FALSE,
  is_local      BOOLEAN DEFAULT TRUE,
  source_trend  TEXT,
  tags          TEXT[],
  copy          JSONB,
  hashtags      JSONB,
  scores        JSONB,         -- output completo del scorer (subscores incluidos)
  trend_context JSONB,         -- trendContext al momento del scoring
  ghost_id      VARCHAR(100),
  ghost_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  reanalyzed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS articles_client_created ON articles(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS articles_source_trend    ON articles(client_id, source_trend, created_at DESC);

-- ---------------------------------------------------------------------------
-- PARRILLA — calendario de publicación por cliente
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parrilla (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  article_id    TEXT,          -- puede ser UUID o id de string (JSON legacy)
  article_title TEXT,
  network       VARCHAR(20) NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  copy          TEXT,
  hashtags      TEXT[],
  status        VARCHAR(20) DEFAULT 'pending',  -- pending, published, cancelled
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS parrilla_client_network_time ON parrilla(client_id, network, scheduled_for);
