require('dotenv').config();
const trends = require('./trends');
const generator = require('./generator');
const scorer = require('./scorer');
const publisher = require('./publisher');
const db = require('./db');

async function run() {
  const timestamp = new Date().toISOString();
  console.log(`\n[Pipeline] Ciclo iniciado: ${timestamp}`);

  try {
    // 1. Obtener trends actuales
    console.log('[Pipeline] 1/4 Obteniendo trends...');
    const trendTopics = await trends.fetch();

    if (!trendTopics.length) {
      console.log('[Pipeline] Sin trends nuevos. Ciclo terminado.');
      return;
    }

    console.log(`[Pipeline] ${trendTopics.length} trend(s) nuevos detectados`);

    // 2. Generar nota con IA para el trend más relevante
    console.log('[Pipeline] 2/4 Generando nota...');
    const nota = await generator.generate(trendTopics[0]);

    if (!nota) {
      console.log('[Pipeline] No se pudo generar la nota. Ciclo terminado.');
      return;
    }

    // 3. Calcular score de publicación en redes
    console.log('[Pipeline] 3/4 Calculando scores...');
    const trendTopic  = trendTopics[0];
    const trendContext = {
      keyword:     trendTopic.keyword,
      sources:     trendTopic.sources  || [trendTopic.source],
      crossSource: trendTopic.crossSource || false,
      trendScore:  trendTopic.score,
    };
    const scores = await scorer.score(nota, trendContext);

    // 4. Publicar en Ghost
    console.log('[Pipeline] 4/4 Publicando en Ghost...');
    const ghostPost = await publisher.publish(nota, scores);

    // Guardar en DB (CLIENT_ID permite asociar el artículo a un cliente específico)
    const clientId = process.env.CLIENT_ID || undefined;
    await db.saveArticle({ nota, scores, ghostPost, clientId });

    console.log(`[Pipeline] Nota publicada: "${nota.title}"`);
    console.log(`[Pipeline] Scores → IG: ${scores.instagram.content} | X: ${scores.x.content} | FB: ${scores.facebook.content} | TK: ${scores.tiktok.content}`);

  } catch (err) {
    console.error('[Pipeline] Error en ciclo:', err.message, err.stack);
  }
}

module.exports = { run };

// Ejecutar directamente si se llama con `node src/pipeline.js`
if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
