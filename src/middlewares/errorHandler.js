const mongoose = require('mongoose');
const env = require('../config/env');

const isApi = (req) => req.originalUrl.startsWith('/api');

function notFound(req, res) {
  if (isApi(req)) return res.status(404).json({ error: 'Ruta no encontrada' });
  return res.status(404).render('error', { title: 'No encontrado', status: 404, message: 'La página que buscas no existe.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Error interno';
  let details = err.details;

  // Errores de validación de Mongoose -> 422
  if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Datos no válidos';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  }
  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Identificador o valor no válido';
  }
  // Cuerpo JSON mal formado
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON mal formado';
  }

  if (status >= 500) {
    console.error(err);
    // No se filtran detalles internos al cliente en producción
    if (env.isProd) message = 'Error interno del servidor';
  }

  if (isApi(req)) {
    return res.status(status).json({ error: message, ...(details ? { details } : {}) });
  }

  return res.status(status).render('error', { title: 'Error', status, message });
}

module.exports = { notFound, errorHandler };
