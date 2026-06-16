'use strict';

const axios = require('axios');

const ACCESS_TOKEN  = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID       = process.env.INSTAGRAM_USER_ID;
const GRAPH_VERSION = 'v21.0';
const BASE          = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Publica una imagen en Instagram usando la Graph API.
 *
 * Flujo:
 *   1. Crear container con la URL de imagen y caption
 *   2. Esperar a que el container esté listo (estado FINISHED)
 *   3. Publicar el container
 *
 * @param {string} urlImagen  - URL pública de la imagen (Supabase Storage)
 * @param {string} caption    - Texto del post
 * @returns {Promise<string>} ID del post publicado
 */
async function publicarEnInstagram(urlImagen, caption) {
  if (!ACCESS_TOKEN || !USER_ID) {
    throw new Error('Faltan INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_USER_ID en .env');
  }

  // Paso 1: Crear container
  const resContainer = await axios.post(`${BASE}/${USER_ID}/media`, null, {
    params: {
      image_url:    urlImagen,
      caption,
      access_token: ACCESS_TOKEN,
    },
  });

  const containerId = resContainer.data.id;
  if (!containerId) throw new Error('Instagram no retornó container ID');

  console.log(`[instagram] Container creado: ${containerId}`);

  // Paso 2: Esperar que el container esté FINISHED (max ~60s)
  await esperarContainer(containerId);

  // Paso 3: Publicar
  const resPublish = await axios.post(`${BASE}/${USER_ID}/media_publish`, null, {
    params: {
      creation_id:  containerId,
      access_token: ACCESS_TOKEN,
    },
  });

  const mediaId = resPublish.data.id;
  console.log(`[instagram] Post publicado: ${mediaId}`);
  return mediaId;
}

async function esperarContainer(containerId, intentos = 12, intervaloMs = 5000) {
  for (let i = 0; i < intentos; i++) {
    const { data } = await axios.get(`${BASE}/${containerId}`, {
      params: {
        fields:       'status_code,status',
        access_token: ACCESS_TOKEN,
      },
    });

    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Container falló: ${data.status || 'estado desconocido'}`);
    }

    await esperar(intervaloMs);
  }

  throw new Error('Timeout esperando que el container de Instagram esté listo');
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { publicarEnInstagram };
