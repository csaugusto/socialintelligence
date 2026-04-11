-- =============================================================================
-- MIGRACIÓN 003 — Studio Content en artículos
-- =============================================================================
-- Agrega studio_content a articles para guardar el trabajo del Content Studio
-- (ganchos, guiones, captions, etc.) ligado a cada brief/oportunidad.
-- =============================================================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS studio_content JSONB;

COMMENT ON COLUMN articles.studio_content IS
  'Contenido generado en el Content Studio: { title, network, tabs: { gancho, guion, caption, cta, articulo, seo, variantes }, updatedAt }';
