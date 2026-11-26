const authService = require('../../services/authService');
const AppError = require('../../utils/AppError');
const { collectErrors } = require('../../validators');
const { startSession, endSession } = require('../../utils/session');

const publicUser = (u) => ({ _id: u._id, username: u.username, email: u.email, role: u.role, bio: u.bio, createdAt: u.createdAt });

exports.register = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) throw AppError.validation(errors);
  const user = await authService.register(req.body);
  await startSession(req, user);
  res.status(201).json({ user: publicUser(user) });
};

exports.login = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) throw AppError.validation(errors);
  const user = await authService.authenticate(req.body.email, req.body.password);
  await startSession(req, user);
  res.json({ user: publicUser(user) });
};

exports.logout = async (req, res) => {
  await endSession(req, res);
  res.status(204).end();
};

exports.me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
