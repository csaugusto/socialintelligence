'use strict';

const axios = require('axios');

const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY;
const BUCKET          = process.env.SUPABASE_BUCKET || 'worldcup-goals';

/**
 * Sube un buffer PNG a Supabase Storage y retorna la URL pública.
 * El bucket debe existir y tener política pública de lectura.
 *
 * @param {Buffer} buffer - PNG a subir
 * @param {string} nombre - Nombre del archivo (sin extensión)
 * @returns {Promise<string>} URL pública de la imagen
 */
async function subirImagen(buffer, nombre) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
  }

  const ruta = `goles/${nombre}-${Date.now()}.png`;
  const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`;

  await axios.put(endpoint, buffer, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
  });

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`;
}

module.exports = { subirImagen };
