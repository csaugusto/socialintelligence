require('dotenv').config();
const cron = require('node-cron');
const pipeline = require('./pipeline');

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/15 * * * *';

console.log(`[Social Intelligence] Iniciando...`);
console.log(`[Cron] Schedule: ${CRON_SCHEDULE}`);

// Ejecutar una vez al arrancar
pipeline.run();

// Luego cada 15 min (o lo que diga .env)
cron.schedule(CRON_SCHEDULE, () => {
  pipeline.run();
});
