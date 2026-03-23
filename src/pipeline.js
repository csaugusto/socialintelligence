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
    const scores = scorer.score(nota);

    // 4. Publicar en Ghost
    console.log('[Pipeline] 4/4 Publicando en Ghost...');
    const ghostPost = await publisher.publish(nota, scores);

    // 5. Guardar en DB
    await db.saveArticle({ nota, scores, ghostPost });

    console.log(`[Pipeline] Nota publicada: "${nota.title}"`);
    console.log(`[Pipeline] Scores → IG: ${scores.instagram.content} | X: ${scores.x.content} | FB: ${scores.facebook.content} | TK: ${scores.tiktok.content}`);

  } catch (err) {
    console.error('[Pipeline] Error en ciclo:', err.message);
  }
}

module.exports = { run };
