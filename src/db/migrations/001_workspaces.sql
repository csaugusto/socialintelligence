-- =============================================================================
-- MIGRACIÓN 001 — Modelo de Workspaces
-- =============================================================================
-- Qué hace:
--   1. Renombra clients → workspaces
--   2. Renombra client_id → workspace_id en todas las tablas
--   3. Renombra client_profiles → workspace_profiles (con campos nuevos)
--   4. Renombra client_scorer_config → workspace_scorer_config
--   5. Crea workspace_members (multiusuario con roles por workspace)
--   6. Crea competitors (monitor de competencia)
--   7. Agrega campos nuevos para onboarding ampliado
--   8. Siembra workspace_members desde usuarios existentes
--
-- Cómo ejecutar (en producción):
--   psql $DATABASE_URL -f src/db/migrations/001_workspaces.sql
--
-- IMPORTANTE: Todo está en una transacción. Si algo falla, no queda nada a medias.
-- =============================================================================

BEGIN;

-- =============================================================================
-- PASO 1 — clients → workspaces
-- =============================================================================

ALTER TABLE clients RENAME TO workspaces;

-- Logo (nuevo campo del onboarding)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- El campo type en clients era: radio, tv, digital, portal, revista, otro
-- Ahora también acepta: creator, brand, agency, blog
-- Los valores existentes quedan válidos (compatibilidad hacia atrás).

-- =============================================================================
-- PASO 2 — client_profiles → workspace_profiles
-- =============================================================================

-- Soltar FK antes de renombrar columna
ALTER TABLE client_profiles
  DROP CONSTRAINT IF EXISTS client_profiles_client_id_fkey;

ALTER TABLE client_profiles
  RENAME COLUMN client_id TO workspace_id;

ALTER TABLE client_profiles
  ADD CONSTRAINT workspace_profiles_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE client_profiles RENAME TO workspace_profiles;

-- Nuevos campos para onboarding ampliado (Pasos 2, 5, 7 y 8 del doc)
ALTER TABLE workspace_profiles
  ADD COLUMN IF NOT EXISTS objectives          TEXT[],        -- paso 2: ¿qué quieres lograr?
  ADD COLUMN IF NOT EXISTS content_pillars     TEXT[],        -- paso 5: pilares de contenido (3-5)
  ADD COLUMN IF NOT EXISTS tone                TEXT[],        -- paso 8: divertido, experto, cercano...
  ADD COLUMN IF NOT EXISTS tone_limits         JSONB,         -- paso 8: { avoid_topics, avoid_language, controversy_level }
  ADD COLUMN IF NOT EXISTS posting_frequency   VARCHAR(50),   -- paso 7: diario | 3-4x | 1-2x | semanal
  ADD COLUMN IF NOT EXISTS production_capacity VARCHAR(50);   -- paso 7: grabar_mucho | poco_tiempo | ideas_rapidas | elaboradas

-- Nota: content_patterns ya existe (fue agregado en migración anterior vía ALTER directo en prod)
-- Si no existe, la siguiente línea la agrega de forma segura:
ALTER TABLE workspace_profiles
  ADD COLUMN IF NOT EXISTS content_patterns JSONB;

-- =============================================================================
-- PASO 3 — client_scorer_config → workspace_scorer_config
-- =============================================================================

ALTER TABLE client_scorer_config
  DROP CONSTRAINT IF EXISTS client_scorer_config_client_id_fkey;

ALTER TABLE client_scorer_config
  RENAME COLUMN client_id TO workspace_id;

ALTER TABLE client_scorer_config
  ADD CONSTRAINT workspace_scorer_config_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE client_scorer_config RENAME TO workspace_scorer_config;

-- =============================================================================
-- PASO 4 — articles: client_id → workspace_id
-- =============================================================================

ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS articles_client_id_fkey;

ALTER TABLE articles
  RENAME COLUMN client_id TO workspace_id;

-- FK sin ON DELETE CASCADE porque los artículos son historial valioso
ALTER TABLE articles
  ADD CONSTRAINT articles_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id);

-- Recrear índices con el nuevo nombre de columna
DROP INDEX IF EXISTS articles_client_created;
DROP INDEX IF EXISTS articles_source_trend;

CREATE INDEX IF NOT EXISTS articles_workspace_created
  ON articles(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS articles_workspace_trend
  ON articles(workspace_id, source_trend, created_at DESC);

-- =============================================================================
-- PASO 5 — parrilla: client_id → workspace_id
-- =============================================================================

ALTER TABLE parrilla
  DROP CONSTRAINT IF EXISTS parrilla_client_id_fkey;

ALTER TABLE parrilla
  RENAME COLUMN client_id TO workspace_id;

ALTER TABLE parrilla
  ADD CONSTRAINT parrilla_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id);

DROP INDEX IF EXISTS parrilla_client_network_time;

CREATE INDEX IF NOT EXISTS parrilla_workspace_network_time
  ON parrilla(workspace_id, network, scheduled_for);

-- =============================================================================
-- PASO 6 — social_accounts: client_id → workspace_id
-- =============================================================================

ALTER TABLE social_accounts
  DROP CONSTRAINT IF EXISTS social_accounts_client_id_fkey;

-- El unique constraint puede tener varios nombres posibles según cómo se creó
ALTER TABLE social_accounts
  DROP CONSTRAINT IF EXISTS social_accounts_client_id_platform_key;
ALTER TABLE social_accounts
  DROP CONSTRAINT IF EXISTS social_accounts_pkey_client_platform;

ALTER TABLE social_accounts
  RENAME COLUMN client_id TO workspace_id;

ALTER TABLE social_accounts
  ADD CONSTRAINT social_accounts_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE social_accounts
  ADD CONSTRAINT social_accounts_workspace_platform_key
  UNIQUE(workspace_id, platform);

-- =============================================================================
-- PASO 7 — NUEVA TABLA: workspace_members
-- =============================================================================
-- Desacopla usuarios de workspaces: un usuario puede pertenecer a varios workspaces
-- con roles distintos en cada uno.
--
-- Roles disponibles:
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

CREATE INDEX IF NOT EXISTS workspace_members_user_idx
  ON workspace_members(user_id);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx
  ON workspace_members(workspace_id);

-- Sembrar workspace_members desde usuarios existentes:
-- Los usuarios 'admin' se convierten en 'owner' de su workspace.
-- Los usuarios 'editor' se convierten en 'editor'.
-- Los 'superadmin' no pertenecen a ningún workspace (acceso global por rol).

INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT
  u.client_id,
  u.id,
  CASE u.role
    WHEN 'admin' THEN 'owner'
    ELSE 'editor'
  END
FROM users u
WHERE u.role != 'superadmin'
  AND u.client_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- =============================================================================
-- PASO 8 — NUEVA TABLA: competitors
-- =============================================================================
-- Cuentas, medios o creadores que el workspace quiere monitorear.
-- Alimenta el módulo de "Estrategia" y "Ventaja competitiva" en briefs.

CREATE TABLE IF NOT EXISTS competitors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  handle       TEXT        NOT NULL,      -- @username, URL o channel ID
  platform     VARCHAR(50) NOT NULL,      -- instagram | tiktok | youtube | web | blog | newsletter
  label        VARCHAR(50) NOT NULL DEFAULT 'competencia'
                           CHECK (label IN ('competencia', 'inspiracion', 'benchmark', 'referente')),
  display_name TEXT,                      -- nombre legible (opcional)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS competitors_workspace_idx
  ON competitors(workspace_id);

-- =============================================================================
-- PASO 9 — Ajustes menores en users
-- =============================================================================

-- Agregar campo name para mostrar en UI (opcional, no obligatorio)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- NOTA: users.client_id y users.role se mantienen por ahora para compatibilidad
-- con el código de auth existente. Se deprecarán cuando el código sea actualizado.
-- La fuente de verdad de roles por workspace es workspace_members.
-- La fuente de verdad de acceso global (superadmin) sigue siendo users.role.

-- =============================================================================
-- FIN
-- =============================================================================

COMMIT;
