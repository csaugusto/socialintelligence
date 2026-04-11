#!/bin/bash
# =============================================================================
# deploy.sh — Actualiza Social Intelligence en producción
#
# Uso:  ./deploy.sh
# Desde el servidor, en el directorio del proyecto.
# =============================================================================

set -e  # detener si cualquier comando falla

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BOLD}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ! $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Deploy — Social Intelligence${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo ""

# 1. Git pull
log "Actualizando código..."
git pull origin main || fail "git pull falló"
ok "Código actualizado"

# 2. Dependencias del pipeline (raíz)
log "Instalando dependencias del pipeline..."
npm install --omit=dev --silent
ok "Pipeline listo"

# 3. Dependencias + build del dashboard
log "Instalando dependencias del dashboard..."
cd dashboard
npm install --omit=dev --silent
ok "Dependencias instaladas"

log "Construyendo dashboard (Next.js)..."
npm run build
ok "Dashboard construido"
cd ..

# 4. Migraciones de base de datos
log "Ejecutando migraciones de base de datos..."
node src/db/migrate.js
ok "Migraciones aplicadas"

# 5. Reiniciar procesos con PM2
log "Reiniciando procesos..."
if pm2 list | grep -q "si-dashboard"; then
  pm2 reload ecosystem.config.js --update-env
  ok "Procesos recargados"
else
  pm2 start ecosystem.config.js
  pm2 save
  ok "Procesos iniciados y guardados"
fi

# 6. Verificar que todo corre
echo ""
log "Estado de procesos:"
pm2 list

echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Deploy completado ✓${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo ""
