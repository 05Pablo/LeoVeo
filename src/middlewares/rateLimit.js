const rateLimit = require('express-rate-limit');

// Respuesta 429 en JSON para la API y como página para la web
const handler = (message) => (req, res) => {
  if (req.originalUrl.startsWith('/api')) return res.status(429).json({ error: message });
  return res.status(429).render('error', { title: 'Demasiados intentos', status: 429, message });
};

// Frena ataques de fuerza bruta contra el login y el registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handler('Demasiados intentos. Prueba de nuevo en 15 minutos.'),
});

// Límite general para la API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: handler('Demasiadas peticiones. Espera un momento.'),
});

module.exports = { authLimiter, apiLimiter };
