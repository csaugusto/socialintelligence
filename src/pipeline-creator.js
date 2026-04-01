require('dotenv').config();
const trends        = require('./trends/creator');
const creator       = require('./generator/creator');
const scorer        = require('./scorer');
const { buildCreatorConfig } = require('./scorer/creatorConfig');
const db            = require('./db');

const CLIENT_ID = process.env.CLIENT_ID;

async function run() {
  const timestamp = new Date().toISOString();
  console.log(`\n[Pipeline Creator] Ciclo iniciado: ${timestamp}`);
  console.log(`[Pipeline Creator] ClientId: ${CLIENT_ID || 'DEFAULT'}`);

  if (!CLIENT_ID) {
    console.warn('[Pipeline Creator] Sin CLIENT_ID — usando cliente por defecto.');
  }

  try {
    // 1. Cargar perfil del creator
    console.log('[Pipeline Creator] 1/4 Cargando perfil del creator...');
    const profile = await db.getClientProfile(CLIENT_ID);
    if (!profile) {
      console.error('[Pipeline Creator] No se encontró perfil para este cliente. Completar onboarding primero.');
      return;
    }
    console.log(`[Pipeline Creator] Nicho: ${profile.main_category} | Red: ${profile.primary_network}`);

    // 2. Obtener trends relevantes para el nicho del creator
    console.log('[Pipeline Creator] 2/4 Obteniendo trends...');
    const trendTopics = await trends.fetch(profile);

    if (!trendTopics.length) {
      console.log('[Pipeline Creator] Sin trends nuevos. Ciclo terminado.');
      return;
    }

    console.log(`[Pipeline Creator] ${trendTopics.length} trend(s) detectados, buscando ángulo para "${profile.main_category}"...`);

    // 3. Intentar generar un brief relevante para el nicho (hasta 5 trends)
    let nota = null;
    let usedTopic = null;

    for (const topic of trendTopics.slice(0, 5)) {
      console.log(`[Pipeline Creator] Evaluando: "${topic.keyword}"`);
      nota = await creator.generate(topic, profile);
      if (nota) {
        usedTopic = topic;
        console.log(`[Pipeline Creator] ✓ Brief generado para "${topic.keyword}" — ángulo: ${nota.angle}`);
        break;
      }
    }

    if (!nota || !usedTopic) {
      console.log('[Pipeline Creator] Ningún trend fue relevante para el nicho. Ciclo terminado.');
      return;
    }

    // 4. Calcular scores (con contexto del creator)
    console.log('[Pipeline Creator] 3/4 Calculando scores...');
    const trendContext = {
      keyword:     usedTopic.keyword,
      sources:     usedTopic.sources || [usedTopic.source],
      crossSource: usedTopic.crossSource || false,
      trendScore:  usedTopic.score,
    };
    const creatorConfig = buildCreatorConfig(profile);
    const scores = await scorer.score(nota, trendContext, creatorConfig);

    // 5. Guardar en DB (sin publicar en Ghost)
    console.log('[Pipeline Creator] 4/4 Guardando brief en base de datos...');
    await db.saveArticle({ nota, scores, ghostPost: null, clientId: CLIENT_ID, trendContext });

    console.log(`[Pipeline Creator] Brief guardado: "${nota.title}"`);
    console.log(`[Pipeline Creator] Scores → IG: ${scores.instagram?.content} | TK: ${scores.tiktok?.content} | X: ${scores.x?.content}`);

  } catch (err) {
    console.error('[Pipeline Creator] Error:', err.message, err.stack);
  }
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
