-- =============================================================================
-- Migración 002 — Perfil IA por workspace
-- =============================================================================
-- Agrega ai_profile a workspaces: string compilado del onboarding que se
-- inyecta como system prompt en todas las llamadas de IA del workspace.
--
-- Aplicar: psql $DATABASE_URL -f src/db/migrations/002_ai_profile.sql
-- =============================================================================

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS ai_profile TEXT;

COMMENT ON COLUMN workspaces.ai_profile IS
  'Perfil estratégico compilado del onboarding. Se inyecta como contexto en cada llamada de IA del workspace.';
