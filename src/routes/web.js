const express = require('express');
const { asyncHandler: h } = require('../utils/helpers');
const { requireAuth, requireRole, requireGuest } = require('../middlewares/auth');
const { verifyCsrf } = require('../middlewares/csrf');
const v = require('../validators');

const auth = require('../controllers/authController');
const works = require('../controllers/workController');
const reviews = require('../controllers/reviewController');
const users = require('../controllers/userController');

const router = express.Router();

// Todas las peticiones POST de la web deben llevar el token CSRF
router.use(verifyCsrf);

router.get('/', h(works.home));

// Autenticación
router.get('/register', requireGuest, auth.showRegister);
router.post('/register', requireGuest, v.registerRules, h(auth.register));
router.get('/login', requireGuest, auth.showLogin);
router.post('/login', requireGuest, v.loginRules, h(auth.login));
router.post('/logout', requireAuth, h(auth.logout));

// Obras
router.get('/works', h(works.index));
router.get('/works/new', requireAuth, works.showNew);
router.post('/works', requireAuth, v.workRules, h(works.create));
router.get('/works/:id', h(works.show));
router.get('/works/:id/edit', requireAuth, h(works.showEdit));
router.post('/works/:id/edit', requireAuth, v.workRules, h(works.update));
router.post('/works/:id/delete', requireRole('admin'), h(works.destroy));

// Reseñas
router.post('/works/:id/reviews', requireAuth, v.reviewRules, h(reviews.create));
router.get('/reviews/:id/edit', requireAuth, h(reviews.showEdit));
router.post('/reviews/:id/edit', requireAuth, v.reviewRules, h(reviews.update));
router.post('/reviews/:id/delete', requireAuth, h(reviews.destroy));

// Usuarios
router.get('/me', requireAuth, users.me);
router.post('/me/bio', requireAuth, v.bioRules, h(users.updateBio));
router.get('/users/:username', h(users.profile));

module.exports = router;
