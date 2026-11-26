const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Hash ficticio para que el tiempo de respuesta sea similar exista o no el email
// (dificulta averiguar qué emails están registrados midiendo tiempos)
let dummyHash;
const getDummyHash = () => {
  if (!dummyHash) dummyHash = bcrypt.hashSync('contraseña-ficticia', env.BCRYPT_ROUNDS);
  return dummyHash;
};

async function register({ username, email, password }) {
  const exists = await User.findOne({
    $or: [{ email: String(email).toLowerCase() }, { username: String(username) }],
  }).lean();
  if (exists) {
    const field = exists.email === String(email).toLowerCase() ? 'email' : 'username';
    throw new AppError(409, 'Ya existe una cuenta con esos datos', {
      [field]: field === 'email' ? 'Ese email ya está registrado' : 'Ese nombre de usuario ya está en uso',
    });
  }
  const passwordHash = await User.hashPassword(password, env.BCRYPT_ROUNDS);
  // Solo se copian los campos permitidos: el rol nunca viene del cliente
  return User.create({ username, email, passwordHash, role: 'user' });
}

async function authenticate(email, password) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash');
  const ok = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(String(password), getDummyHash()).then(() => false);
  if (!ok) throw new AppError(401, 'Email o contraseña incorrectos');
  user.passwordHash = undefined;
  return user;
}

module.exports = { register, authenticate };
