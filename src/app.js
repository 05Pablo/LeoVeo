const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');

function createApp() {
  const app = express();

  // Vistas EJS
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.disable('x-powered-by');

  // Cabeceras de seguridad
  app.use(helmet());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use(express.json({ limit: '20kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // TODO: sesiones y autenticación

  app.use('/api', apiRoutes);
  app.use('/', webRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
