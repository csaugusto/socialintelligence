-- =============================================================================
-- Social Intelligence — PostgreSQL Schema
-- =============================================================================
-- Para instalación nueva: psql $DATABASE_URL -f src/db/schema.sql
-- Para migrar desde schema anterior: psql $DATABASE_URL -f src/db/migrations/001_workspaces.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- WORKSPACES — la empresa, marca o creador como entidad principal
-- =============================================================================
-- Un workspace es el contenedor de todo: perfil, usuarios, contenido, cuentas.
-- Un usuario puede pertenecer a múltiples workspaces con distintos roles.

CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  type        VARCHAR(50)  NOT NULL,     -- creator | brand | company | media | agency | blog
                                         -- (media legacy: radio, tv, digital, portal, revista)
  vertical    VARCHAR(20)  NOT NULL DEFAULT 'media',  -- media | creator
  coverage    VARCHAR(50),               -- nacional | regional | local (aplica a vertical media)
  region      VARCHAR(100),              -- ciudad o estado
  logo_url    TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace default para retrocompatibilidad (modo single-tenant)
INSERT INTO workspaces (id, name, slug, type, coverage)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default', 'media', 'nacional')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- USERS — usuarios globales del sistema
-- =============================================================================
-- Los usuarios son entidades globales. Su membresía y rol en cada workspace
-- se define en workspace_members.
-- Excepción: role='superadmin' es un rol de sistema (acceso global, sin workspace).

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  role          VARCHAR(20)  DEFAULT 'user',   -- user | superadmin
  -- client_id se mantiene temporalmente para compatibilidad con código de auth actual
  -- Se removerá cuando auth sea actualizado para usar workspace_members
  client_id     UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WORKSPACE_MEMBERS — membresía y roles por workspace
-- =============================================================================
-- Desacopla usuarios de workspaces: un usuario puede pertenecer a varios
-- workspaces con roles distintos en cada uno.
--
-- Roles:
--   owner    → control total, puede invitar/eliminar usuarios
--   editor   → configura, revisa y aprueba contenido
--   creator  → genera y mueve contenido (community manager)
--   analyst  → solo lectura de resultados
--   viewer   → solo consulta (para clientes externos)

CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id)  ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL DEFAULT 'editor'
                           CHECK (role IN ('owner', 'editor', 'creator', 'analyst', 'viewer')),
  invited_by   UUID        REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_user_idx      ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx ON workspace_members(workspace_id);

-- =============================================================================
-- WORKSPACE_PROFILES — datos del onboarding estratégico
-- =============================================================================
-- Almacena el contexto completo del workspace: objetivos, nicho, pilares,
-- tono, frecuencia, y el perfil narrativo generado por IA.
-- Campos bifurcados por vertical (media vs creator).

CREATE TABLE IF NOT EXISTS workspace_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Paso 2: Objetivos (en lenguaje natural, mapeados a funnel internamente)
  objectives           TEXT[],          -- ['descubrir', 'interaccion', 'confianza', 'conversion']

  -- Paso 3: Plataformas (compartido media + creator)
  active_networks      TEXT[],          -- ['instagram', 'tiktok', 'youtube', ...]
  primary_network      VARCHAR(50),     -- red principal / red estrella

  -- Paso 4: Nicho y temas (creator) / Categorías (media)
  categories           TEXT[],          -- categorías que cubre
  main_category        VARCHAR(50),
  nicho                TEXT[],          -- nichos del creator (multi-select)
  tags                 TEXT[],          -- etiquetas clave adicionales

  -- Paso 5: Pilares de contenido (3-5 seleccionados)
  content_pillars      TEXT[],          -- ['noticias', 'opinion', 'tips', 'humor', ...]

  -- Paso 7: Ritmo de publicación
  posting_frequency    VARCHAR(50),     -- 'diario' | '3-4x' | '1-2x' | 'semanal' | 'recomendado'
  production_capacity  VARCHAR(50),     -- 'grabar_mucho' | 'poco_tiempo' | 'ideas_rapidas' | 'elaboradas'

  -- Paso 8: Tono y límites
  tone                 TEXT[],          -- ['divertido', 'informativo', 'cercano', ...]
  tone_limits          JSONB,           -- { avoid_topics: [], avoid_language: [], controversy_level: 'bajo' }

  -- Análisis automático de contenido propio (via pipeline)
  content_patterns     JSONB,           -- { top_topics, tone, what_works, what_doesnt, avoid, ... }

  -- Perfil narrativo generado por Groq (alimenta al scorer y al matcher)
  profile_narrative    TEXT,

  -- Campos específicos de vertical media (legacy)
  produces_video       BOOLEAN DEFAULT FALSE,
  covers_breaking      BOOLEAN DEFAULT FALSE,
  editorial_schedule   JSONB,           -- { start: "07:00", end: "22:00", days: [1,2,3,4,5] }
  team_size            INTEGER,
  audience_age_range   VARCHAR(50),
  known_peak_hours     JSONB,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WORKSPACE_SCORER_CONFIG — overrides numéricos del scorer por workspace
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspace_scorer_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  category_weights JSONB,
  hour_factors     JSONB,
  day_multipliers  JSONB,
  format_signals   JSONB,
  production_time  JSONB,
  enabled_networks TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- COMPETITORS — cuentas y medios monitoreados por workspace
-- =============================================================================

CREATE TABLE IF NOT EXISTS competitors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  handle       TEXT        NOT NULL,     -- @username, URL o channel ID
  platform     VARCHAR(50) NOT NULL,     -- instagram | tiktok | youtube | web | blog | newsletter
  label        VARCHAR(50) NOT NULL DEFAULT 'competencia'
                           CHECK (label IN ('competencia', 'inspiracion', 'benchmark', 'referente')),
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS competitors_workspace_idx ON competitors(workspace_id);

-- =============================================================================
-- SOCIAL_ACCOUNTS — cuentas conectadas por workspace
-- =============================================================================

CREATE TABLE IF NOT EXISTS social_accounts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform         VARCHAR(50) NOT NULL,
  username         TEXT,
  channel_id       TEXT,
  connection_type  VARCHAR(20) DEFAULT 'username',  -- username | oauth
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, platform)
);

-- =============================================================================
-- ARTICLES — notas generadas por el pipeline
-- =============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id)
                     DEFAULT '00000000-0000-0000-0000-000000000001',
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
  scores        JSONB,
  trend_context JSONB,
  brief         JSONB,
  angle         TEXT,
  ghost_id      VARCHAR(100),
  ghost_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  reanalyzed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS articles_workspace_created
  ON articles(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS articles_workspace_trend
  ON articles(workspace_id, source_trend, created_at DESC);

-- =============================================================================
-- PARRILLA — calendario de publicación por workspace
-- =============================================================================

CREATE TABLE IF NOT EXISTS parrilla (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id)
                     DEFAULT '00000000-0000-0000-0000-000000000001',
  article_id    TEXT,
  article_title TEXT,
  network       VARCHAR(20) NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  copy          TEXT,
  hashtags      TEXT[],
  status        VARCHAR(20) DEFAULT 'pending',   -- pending | published | cancelled
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS parrilla_workspace_network_time
  ON parrilla(workspace_id, network, scheduled_for);
