const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const flash = require('./middlewares/flash');
const { csrfToken } = require('./middlewares/csrf');
const { loadUser } = require('./middlewares/auth');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { SESSION_COOKIE } = require('./utils/session');
const { TYPE_LABELS } = require('./utils/helpers');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');

/**
 * Crea y configura la aplicación Express.
 * @param {{ mongoClient?: import('mongodb').MongoClient }} options
 */
function createApp({ mongoClient } = {}) {
  const app = express();

  // --- Vistas (V de MVC) ---
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.disable('x-powered-by');

  // Helpers disponibles en todas las vistas
  app.locals.TYPE_LABELS = TYPE_LABELS;
  app.locals.formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  app.locals.stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  // --- Seguridad: cabeceras HTTP (CSP, X-Frame-Options, HSTS...) ---
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'https:'],
        // Sin HTTPS local no se fuerza la actualización de peticiones
        'upgrade-insecure-requests': env.COOKIE_SECURE ? [] : null,
      },
    },
  }));

  if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // --- Lectura del cuerpo con límite de tamaño ---
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use(express.json({ limit: '20kb' }));

  app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: env.isProd ? '7d' : 0 }));

  // --- Sesiones guardadas en MongoDB ---
  app.use(session({
    name: SESSION_COOKIE,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      ...(mongoClient ? { client: mongoClient } : { mongoUrl: env.MONGO_URI }),
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true, // no accesible desde JavaScript (mitiga robo por XSS)
      sameSite: 'lax', // no se envía en peticiones POST de otros sitios (mitiga CSRF)
      secure: env.COOKIE_SECURE, // solo por HTTPS cuando está activado
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));

  app.use(flash);
  app.use(csrfToken);
  app.use(loadUser);
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
  });

  // --- Rutas ---
  app.use('/api', apiRoutes);
  app.use('/', webRoutes);

  // --- Errores ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
