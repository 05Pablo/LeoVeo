// Express 4 no captura promesas rechazadas: este envoltorio las pasa a next()
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Escapa caracteres especiales para usar texto del usuario dentro de una RegExp
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Convierte "Drama, Ciencia ficción" -> ['drama', 'ciencia ficción']
const parseGenres = (value) => {
  if (Array.isArray(value)) value = value.join(',');
  if (!value) return [];
  return [...new Set(
    String(value).split(',').map((g) => g.trim().toLowerCase()).filter(Boolean),
  )].slice(0, 8);
};

const TYPE_LABELS = { pelicula: 'Película', libro: 'Libro' };

module.exports = { asyncHandler, escapeRegex, parseGenres, TYPE_LABELS };
