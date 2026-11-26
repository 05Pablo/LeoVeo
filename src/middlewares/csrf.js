const crypto = require('crypto');
const AppError = require('../utils/AppError');

// Protección CSRF para los formularios web (patrón "synchronizer token"):
// se guarda un token aleatorio en la sesión, se inserta como campo oculto
// en cada formulario y se comprueba en cada petición que modifica datos.
function csrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = Buffer.from(String((req.body && req.body._csrf) || req.get('x-csrf-token') || ''));
  const expected = Buffer.from(String(req.session.csrfToken || ''));
  const valid = expected.length > 0 && sent.length === expected.length
    && crypto.timingSafeEqual(sent, expected);
  if (!valid) return next(new AppError(403, 'Token CSRF no válido. Recarga la página e inténtalo de nuevo.'));
  return next();
}

// Para la API JSON: las peticiones que modifican datos deben enviar
// Content-Type: application/json. Un formulario HTML de otro sitio no puede
// enviar ese tipo sin una petición CORS previa (que no autorizamos), así que
// junto con la cookie SameSite=Lax esto mitiga CSRF en la API.
function requireJson(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(req.method)) return next();
  if (!req.is('application/json')) {
    return next(new AppError(415, 'La API solo acepta Content-Type: application/json'));
  }
  return next();
}

module.exports = { csrfToken, verifyCsrf, requireJson };
