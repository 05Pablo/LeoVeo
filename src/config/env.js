// Carga y valida la configuración a partir de variables de entorno (.env)
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProd) {
    throw new Error('SESSION_SECRET es obligatorio en producción');
  }
  sessionSecret = 'dev-secret-no-usar-en-produccion';
  console.warn('[env] SESSION_SECRET no definido: usando un secreto de desarrollo');
}

module.exports = {
  NODE_ENV,
  isProd,
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/leoveo',
  SESSION_SECRET: sessionSecret,
  // Poner a true solo si la app se sirve por HTTPS (p. ej. detrás de un proxy con TLS)
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  // Número de proxies inversos delante de la app (0 = ninguno). Afecta a req.ip y al rate limit
  TRUST_PROXY: parseInt(process.env.TRUST_PROXY, 10) || 0,
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
};
