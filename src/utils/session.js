const SESSION_COOKIE = 'leoveo.sid';

// Inicia sesión regenerando el id de sesión (evita la fijación de sesión)
function startSession(req, user) {
  const returnTo = req.session.returnTo;
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = String(user._id);
      return req.session.save((err2) => (err2 ? reject(err2) : resolve(returnTo)));
    });
  });
}

function endSession(req, res) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) return reject(err);
      res.clearCookie(SESSION_COOKIE);
      return resolve();
    });
  });
}

// Solo se permiten redirecciones a rutas internas (evita open redirect)
const safeRedirect = (url) => (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/');

module.exports = { SESSION_COOKIE, startSession, endSession, safeRedirect };
