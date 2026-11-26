const User = require('../models/User');
const AppError = require('../utils/AppError');

const wantsJson = (req) => req.originalUrl.startsWith('/api');

// Carga el usuario de la sesión en cada petición. Se consulta la BD (y no se
// guarda el usuario entero en la sesión) para que un cambio de rol o un
// borrado de cuenta tenga efecto inmediato.
async function loadUser(req, res, next) {
  try {
    req.user = null;
    if (req.session && req.session.userId) {
      req.user = await User.findById(req.session.userId).lean();
      if (!req.user) delete req.session.userId;
    }
    res.locals.currentUser = req.user;
    next();
  } catch (err) {
    next(err);
  }
}

// Autenticación: exige sesión iniciada
function requireAuth(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) return next(AppError.unauthorized());
  if (req.method === 'GET') req.session.returnTo = req.originalUrl;
  req.flash('error', 'Debes iniciar sesión para continuar');
  return res.redirect('/login');
}

// Autorización por rol: requireRole('admin')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return requireAuth(req, res, next);
  if (roles.includes(req.user.role)) return next();
  return next(AppError.forbidden());
};

// Solo para visitantes (login / registro)
function requireGuest(req, res, next) {
  if (!req.user) return next();
  return res.redirect('/');
}

module.exports = { loadUser, requireAuth, requireRole, requireGuest };
