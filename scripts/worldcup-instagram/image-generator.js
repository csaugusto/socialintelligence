'use strict';

const sharp = require('sharp');
const { getPais } = require('./countries');

const ANCHO  = 1080;
const ALTO   = 1080;

/**
 * Genera una imagen PNG 1080×1080 para un evento de gol.
 * Usa una plantilla SVG renderizada por sharp.
 *
 * Nota: Para que los emoji de bandera se rendericen correctamente en el servidor,
 * instalar la fuente: sudo apt-get install fonts-noto-color-emoji
 *
 * @param {Object} gol - Objeto de gol retornado por xml-parser
 * @returns {Promise<Buffer>} Buffer PNG listo para subir
 */
async function generarImagenGol(gol) {
  const local     = getPais(gol.local.codigo);
  const visitante = getPais(gol.visitante.codigo);

  const nombreLocal     = gol.local.nombre     || local.nombre;
  const nombreVisitante = gol.visitante.nombre  || visitante.nombre;
  const marcador        = `${gol.local.goles} - ${gol.visitante.goles}`;
  const minutoTexto     = gol.extra > 0 ? `${gol.minuto}+${gol.extra}'` : `${gol.minuto}'`;

  const lineaAsistencia = gol.asistencia
    ? `<text x="540" y="860" text-anchor="middle" font-family="'Noto Sans', Arial, sans-serif" font-size="34" fill="#9ca3af">Asistencia: ${escaparXml(gol.asistencia)}</text>`
    : '';

  const svg = `<svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fondo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#1a1f35"/>
    </linearGradient>
    <linearGradient id="bandaLocal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${local.color}55"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <linearGradient id="bandaVisitante" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="transparent"/>
      <stop offset="100%" stop-color="${visitante.color}55"/>
    </linearGradient>
  </defs>

  <!-- Fondo -->
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#fondo)"/>

  <!-- Bandas de color por equipo -->
  <rect x="0" y="0" width="500" height="${ALTO}" fill="url(#bandaLocal)" opacity="0.6"/>
  <rect x="580" y="0" width="500" height="${ALTO}" fill="url(#bandaVisitante)" opacity="0.6"/>

  <!-- Línea vertical central -->
  <line x1="540" y1="180" x2="540" y2="680" stroke="#ffffff22" stroke-width="1"/>

  <!-- Header -->
  <text x="540" y="90" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="28" fill="#c4a44e" font-weight="bold"
        letter-spacing="4">MUNDIAL 2026</text>
  <line x1="200" y1="108" x2="880" y2="108" stroke="#c4a44e" stroke-width="1" opacity="0.5"/>

  <!-- Banderas (emoji) -->
  <text x="270" y="420" text-anchor="middle"
        font-family="'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"
        font-size="200">${local.bandera}</text>
  <text x="810" y="420" text-anchor="middle"
        font-family="'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"
        font-size="200">${visitante.bandera}</text>

  <!-- Nombres de equipos -->
  <text x="270" y="510" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="40" fill="#ffffff" font-weight="bold">${escaparXml(nombreLocal)}</text>
  <text x="810" y="510" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="40" fill="#ffffff" font-weight="bold">${escaparXml(nombreVisitante)}</text>

  <!-- Marcador -->
  <text x="540" y="490" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="96" fill="#ffffff" font-weight="900">${marcador}</text>

  <!-- Separador -->
  <line x1="180" y1="570" x2="900" y2="570" stroke="#c4a44e" stroke-width="2"/>

  <!-- GOOOOL -->
  <text x="540" y="660" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="80" fill="#4ade80" font-weight="900">⚽ GOOOOL!</text>

  <!-- Goleador y minuto -->
  <text x="540" y="760" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="48" fill="#f9fafb" font-weight="bold">${escaparXml(gol.goleador)} ${minutoTexto}</text>

  <!-- Asistencia (condicional) -->
  ${lineaAsistencia}

  <!-- Footer -->
  <line x1="200" y1="950" x2="880" y2="950" stroke="#c4a44e" stroke-width="1" opacity="0.4"/>
  <text x="540" y="990" text-anchor="middle"
        font-family="'Noto Sans', Arial, sans-serif" font-size="26" fill="#6b7280">#Mundial2026 #FIFAWorldCup</text>
</svg>`;

  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return buffer;
}

function escaparXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { generarImagenGol };
