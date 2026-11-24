const mongoose = require('mongoose');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const createApp = require('./app');

async function main() {
  await connectDB();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] LeoVeo escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Apagado ordenado (docker stop envía SIGTERM)
  const shutdown = (signal) => {
    console.log(`[server] ${signal} recibido, cerrando...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[server] Error al arrancar:', err);
  process.exit(1);
});
