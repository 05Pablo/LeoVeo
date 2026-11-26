const authService = require('../services/authService');
const AppError = require('../utils/AppError');
const { collectErrors } = require('../validators');
const { startSession, endSession, safeRedirect } = require('../utils/session');

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Crear cuenta', errors: {}, values: {} });
};

exports.register = async (req, res) => {
  const values = { username: req.body.username, email: req.body.email };
  const errors = collectErrors(req);
  if (errors) {
    return res.status(422).render('auth/register', { title: 'Crear cuenta', errors, values });
  }
  try {
    const user = await authService.register(req.body);
    await startSession(req, user);
    req.flash('success', `¡Bienvenido/a a LeoVeo, ${user.username}!`);
    return res.redirect('/');
  } catch (err) {
    if (err instanceof AppError && err.status === 409) {
      return res.status(409).render('auth/register', { title: 'Crear cuenta', errors: err.details || {}, values });
    }
    throw err;
  }
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar sesión', errors: {}, values: {} });
};

exports.login = async (req, res) => {
  const values = { email: req.body.email };
  const errors = collectErrors(req);
  if (errors) {
    return res.status(422).render('auth/login', { title: 'Iniciar sesión', errors, values });
  }
  try {
    const user = await authService.authenticate(req.body.email, req.body.password);
    const returnTo = await startSession(req, user);
    req.flash('success', `Hola de nuevo, ${user.username}`);
    return res.redirect(safeRedirect(returnTo));
  } catch (err) {
    if (err instanceof AppError && err.status === 401) {
      return res.status(401).render('auth/login', { title: 'Iniciar sesión', errors: { general: err.message }, values });
    }
    throw err;
  }
};

exports.logout = async (req, res) => {
  await endSession(req, res);
  res.redirect('/');
};
