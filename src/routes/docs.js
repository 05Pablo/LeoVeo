const path = require('path');
const express = require('express');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Especificación OpenAPI 3 de la API (src/docs/openapi.yaml)
const spec = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));

const router = express.Router();

// Swagger UI carga estilos e imágenes propios: se relaja la CSP solo en /api-docs
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'img-src': ["'self'", 'data:', 'https:'],
      'upgrade-insecure-requests': null,
    },
  },
}));

// El JSON de la especificación, por si se quiere importar en Postman o Insomnia
router.get('/openapi.json', (req, res) => res.json(spec));

router.use('/', swaggerUi.serve, swaggerUi.setup(spec, {
  customSiteTitle: 'LeoVeo · API v1',
  swaggerOptions: { withCredentials: true, persistAuthorization: true },
}));

module.exports = router;
