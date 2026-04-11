#!/bin/bash
# =============================================================================
# setup.sh — Configuración inicial de instancia en Google Cloud (Debian 12)
#
# Uso:
#   1. SSH a la instancia nueva
#   2. git clone <repo> social-intelligence && cd social-intelligence
#   3. chmod +x setup.sh && ./setup.sh
#   4. Editar .env y dashboard/.env.local con tus claves
#   5. ./deploy.sh
# =============================================================================

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${BOLD}▸ $1${NC}"; }
ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }

echo ""
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}  Setup — Social Intelligence${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo ""

# ── 1. Paquetes del sistema ───────────────────────────────────────────────────
log "Actualizando sistema..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
ok "Sistema actualizado"

log "Instalando dependencias del sistema..."
sudo apt-get install -y -qq \
  curl git ca-certificates gnupg \
  apache2 unzip
ok "Paquetes instalados"

# ── 2. Node.js 20 ────────────────────────────────────────────────────────────
log "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq
sudo apt-get install -y -qq nodejs
ok "Node.js $(node -v) instalado"

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
log "Instalando PM2..."
sudo npm install -g pm2 --silent
pm2 startup systemd -u $USER --hp $HOME | tail -1 | sudo bash
ok "PM2 instalado y configurado para arranque automático"

# ── 4. Docker + Docker Compose ───────────────────────────────────────────────
log "Instalando Docker..."
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
ok "Docker instalado"

log "Instalando Docker Compose..."
sudo apt-get install -y -qq docker-compose-plugin
ok "Docker Compose instalado"

# ── 5. Docker: levantar base de datos ────────────────────────────────────────
log "Levantando base de datos con Docker..."
# Solo postgres (sin Ghost por ahora — decidir después)
docker compose up -d postgres
ok "PostgreSQL corriendo"

# ── 6. Apache — módulos para proxy ───────────────────────────────────────────
log "Configurando Apache como reverse proxy..."
sudo a2enmod proxy proxy_http headers rewrite
sudo systemctl restart apache2
ok "Apache configurado"

# ── 7. Virtual host de Apache ─────────────────────────────────────────────────
# Cambia TU_DOMINIO por tu dominio real o IP
DOMAIN="${1:-_}"  # Acepta el dominio como argumento: ./setup.sh midominio.com

sudo tee /etc/apache2/sites-available/social-intelligence.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName ${DOMAIN}

    ProxyPreserveHost On
    ProxyRequests    Off

    # Dashboard (Next.js)
    ProxyPass        / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    # Headers de seguridad
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    ErrorLog  \${APACHE_LOG_DIR}/si-error.log
    CustomLog \${APACHE_LOG_DIR}/si-access.log combined
</VirtualHost>
EOF

sudo a2ensite social-intelligence.conf
sudo a2dissite 000-default.conf 2>/dev/null || true
sudo systemctl reload apache2
ok "Virtual host configurado para: ${DOMAIN}"

# ── 8. Archivos de entorno ────────────────────────────────────────────────────
log "Creando archivos de entorno..."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "  → .env creado desde .env.example — EDITA con tus claves"
else
  echo "  → .env ya existe, no se sobreescribe"
fi

if [ ! -f dashboard/.env.local ]; then
  cat > dashboard/.env.local <<'ENVEOF'
DATABASE_URL=postgresql://si_user:si_pass@localhost:5432/social_intelligence
NEXTAUTH_SECRET=CAMBIA_ESTO_POR_UN_SECRET_LARGO
NEXTAUTH_URL=http://localhost:3001
GROQ_API_KEY=
YOUTUBE_API_KEY=
ENVEOF
  echo "  → dashboard/.env.local creado — EDITA con tus claves"
else
  echo "  → dashboard/.env.local ya existe, no se sobreescribe"
fi
ok "Archivos de entorno listos"

# ── 9. Permisos del deploy script ────────────────────────────────────────────
chmod +x deploy.sh
ok "deploy.sh listo para ejecutar"

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Setup completado ✓${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo ""
echo "  Siguientes pasos:"
echo "  1. Edita .env con tus API keys (GROQ, NEWS_API, etc.)"
echo "  2. Edita dashboard/.env.local con NEXTAUTH_SECRET y API keys"
echo "  3. Corre: ./deploy.sh"
echo ""
echo "  Para SSL (HTTPS) después del deploy:"
echo "  sudo apt install certbot python3-certbot-apache"
echo "  sudo certbot --apache -d ${DOMAIN}"
echo ""
