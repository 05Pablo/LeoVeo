const express = require('express');
const { asyncHandler: h } = require('../utils/helpers');
const { requireAuth, requireGuest } = require('../middlewares/auth');
const { verifyCsrf } = require('../middlewares/csrf');
const v = require('../validators');

const auth = require('../controllers/authController');

const router = express.Router();

// Todas las peticiones POST de la web deben llevar el token CSRF
router.use(verifyCsrf);

router.get('/', (req, res) => res.render('home', { title: 'Inicio' }));

// Autenticación
router.get('/register', requireGuest, auth.showRegister);
router.post('/register', requireGuest, v.registerRules, h(auth.register));
router.get('/login', requireGuest, auth.showLogin);
router.post('/login', requireGuest, v.loginRules, h(auth.login));
router.post('/logout', requireAuth, h(auth.logout));

// TODO: obras, reseñas y perfiles

module.exports = router;
