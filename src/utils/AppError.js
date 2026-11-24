// Error de aplicación con código HTTP. Lo lanzan los servicios y lo
// traduce el manejador de errores a JSON (API) o a una vista (web).
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }

  static badRequest(msg = 'Petición no válida', details) { return new AppError(400, msg, details); }
  static unauthorized(msg = 'Debes iniciar sesión') { return new AppError(401, msg); }
  static forbidden(msg = 'No tienes permiso para realizar esta acción') { return new AppError(403, msg); }
  static notFound(msg = 'Recurso no encontrado') { return new AppError(404, msg); }
  static conflict(msg = 'El recurso ya existe') { return new AppError(409, msg); }
  static validation(details) { return new AppError(422, 'Datos no válidos', details); }
}

module.exports = AppError;
