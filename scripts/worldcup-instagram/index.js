'use strict';

require('dotenv').config();

const WebSocket = require('ws');
const { detectarGoles }       = require('./xml-parser');
const { generarImagenGol }    = require('./image-generator');
const { subirImagen }         = require('./storage');
const { publicarEnInstagram } = require('./instagram');
const { getPais }             = require('./countries');

const WS_URL      = process.env.DATAFACTORY_WS_URL;
const DF_TOKEN    = process.env.DATAFACTORY_TOKEN;
const COOLDOWN_MS = Number(process.env.POST_COOLDOWN_MS || 5000);
const CAPTION_PREFIX = process.env.CAPTION_PREFIX || '#Mundial2026 #FIFAWorldCup';

let ws;
let ultimoPost = 0;
let intentosReconexion = 0;
const MAX_REINTENTOS = 20;

function construirCaption(gol) {
  const local     = getPais(gol.local.codigo);
  const visitante = getPais(gol.visitante.codigo);
  const minuto    = gol.extra > 0 ? `${gol.minuto}+${gol.extra}'` : `${gol.minuto}'`;

  const lines = [
    `⚽ GOOOOL! ${local.bandera} ${gol.local.nombre || local.nombre} ${gol.local.goles} - ${gol.visitante.goles} ${gol.visitante.nombre || visitante.nombre} ${visitante.bandera}`,
    ``,
    `🎯 ${gol.goleador} · ${minuto}`,
  ];

  if (gol.asistencia) {
    lines.push(`🅰️ Asistencia: ${gol.asistencia}`);
  }

  lines.push(``, CAPTION_PREFIX);
  return lines.join('\n');
}

async function procesarGol(gol) {
  // Cooldown entre posts para respetar rate limits de Instagram
  const ahora = Date.now();
  const espera = COOLDOWN_MS - (ahora - ultimoPost);
  if (espera > 0) {
    console.log(`[bot] Esperando cooldown (${espera}ms)...`);
    await new Promise((r) => setTimeout(r, espera));
  }

  try {
    console.log(`[bot] Procesando gol: ${gol.goleador} (${gol.minuto}') — Match ${gol.matchId}`);

    const imagen  = await generarImagenGol(gol);
    const nombre  = `${gol.matchId}-${gol.eventoId}`;
    const urlImg  = await subirImagen(imagen, nombre);
    const caption = construirCaption(gol);

    await publicarEnInstagram(urlImg, caption);

    ultimoPost = Date.now();
    console.log(`[bot] ✅ Post publicado para gol ${gol.eventoId}`);
  } catch (err) {
    console.error(`[bot] ❌ Error publicando gol ${gol.eventoId}:`, err.message);
  }
}

function conectar() {
  if (!WS_URL) {
    console.error('[bot] DATAFACTORY_WS_URL no está configurado. Revisar .env');
    process.exit(1);
  }

  const url = DF_TOKEN ? `${WS_URL}?token=${encodeURIComponent(DF_TOKEN)}` : WS_URL;
  console.log(`[bot] Conectando a Datafactory WebSocket...`);

  ws = new WebSocket(url);

  ws.on('open', () => {
    intentosReconexion = 0;
    console.log('[bot] ✅ Conectado a Datafactory. Escuchando goles del Mundial...');
  });

  ws.on('message', async (data) => {
    const xml = data.toString('utf8');
    const goles = detectarGoles(xml);

    for (const gol of goles) {
      // Procesar en serie para no saturar la API de Instagram
      await procesarGol(gol);
    }
  });

  ws.on('error', (err) => {
    console.error('[bot] Error WebSocket:', err.message);
  });

  ws.on('close', (code, reason) => {
    console.warn(`[bot] WebSocket cerrado (${code}: ${reason}). Reconectando...`);
    intentosReconexion++;

    if (intentosReconexion > MAX_REINTENTOS) {
      console.error('[bot] Máximo de reintentos alcanzado. Saliendo.');
      process.exit(1);
    }

    // Backoff exponencial con tope en 60s
    const delay = Math.min(1000 * Math.pow(2, intentosReconexion - 1), 60000);
    console.log(`[bot] Reintento ${intentosReconexion}/${MAX_REINTENTOS} en ${delay / 1000}s`);
    setTimeout(conectar, delay);
  });
}

process.on('SIGINT',  () => { ws?.close(); process.exit(0); });
process.on('SIGTERM', () => { ws?.close(); process.exit(0); });

conectar();
