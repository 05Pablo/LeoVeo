const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler: h } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { requireJson } = require('../middlewares/csrf');
const { authLimiter, apiLimiter } = require('../middlewares/rateLimit');
const v = require('../validators');

const authApi = require('../controllers/api/authApiController');
const worksApi = require('../controllers/api/workApiController');
const reviewsApi = require('../controllers/api/reviewApiController');
const usersApi = require('../controllers/api/userApiController');

const router = express.Router();

router.use(apiLimiter);
router.use(requireJson);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down', uptime: process.uptime() });
});

// Autenticación (sesión con cookie httpOnly, igual que la web)
router.post('/auth/register', authLimiter, v.registerRules, h(authApi.register));
router.post('/auth/login', authLimiter, v.loginRules, h(authApi.login));
router.post('/auth/logout', requireAuth, h(authApi.logout));
router.get('/auth/me', requireAuth, authApi.me);

// Obras
router.get('/works', h(worksApi.list));
router.get('/genres', h(worksApi.genres));
router.get('/works/:id', h(worksApi.get));
router.post('/works', requireAuth, v.workRules, h(worksApi.create));
router.put('/works/:id', requireAuth, v.workRules, h(worksApi.update));
router.delete('/works/:id', requireRole('admin'), h(worksApi.remove));

// Reseñas
router.get('/works/:id/reviews', h(worksApi.listReviews));
router.post('/works/:id/reviews', requireAuth, v.reviewRules, h(worksApi.createReview));
router.get('/reviews', h(reviewsApi.latest));
router.get('/reviews/:id', h(reviewsApi.get));
router.put('/reviews/:id', requireAuth, v.reviewRules, h(reviewsApi.update));
router.delete('/reviews/:id', requireAuth, h(reviewsApi.remove));

// Usuarios
router.get('/users/:username', h(usersApi.profile));
router.get('/admin/users', requireRole('admin'), h(usersApi.list));
router.patch('/admin/users/:id/role', requireRole('admin'), h(usersApi.setRole));

module.exports = router;
