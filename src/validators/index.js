const { body, validationResult } = require('express-validator');
const Work = require('../models/Work');

// Devuelve { campo: 'mensaje' } o null si no hay errores
function collectErrors(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return null;
  const errors = {};
  for (const e of result.array()) {
    if (!errors[e.path]) errors[e.path] = e.msg;
  }
  return errors;
}

const registerRules = [
  body('username').isString().trim()
    .isLength({ min: 3, max: 30 }).withMessage('Entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Solo letras, números y guion bajo'),
  body('email').isString().trim().isEmail().withMessage('Email no válido')
    .isLength({ max: 254 }).normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString()
    .isLength({ min: 8, max: 72 }).withMessage('Entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/).withMessage('Debe contener al menos una letra')
    .matches(/\d/).withMessage('Debe contener al menos un número'),
  body('passwordConfirm').optional({ values: 'undefined' })
    .custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden'),
];

const loginRules = [
  body('email').isString().trim().isEmail().withMessage('Email no válido').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().notEmpty().withMessage('Introduce la contraseña'),
];

const workRules = [
  body('title').isString().trim().notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
  body('type').isIn(Work.TYPES).withMessage('Tipo no válido'),
  body('creator').isString().trim().notEmpty().withMessage('Indica el director o autor')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('year').optional({ values: 'falsy' }).isInt({ min: 1800, max: 2100 }).withMessage('Año entre 1800 y 2100').toInt(),
  body('genres').optional().custom((v) => typeof v === 'string' || Array.isArray(v)).withMessage('Géneros no válidos'),
  body('synopsis').optional().isString().trim().isLength({ max: 2000 }).withMessage('Máximo 2000 caracteres'),
  body('coverUrl').optional({ values: 'falsy' }).isString().trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Debe ser una URL http(s) válida'),
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La puntuación va de 1 a 5').toInt(),
  body('title').isString().trim().notEmpty().withMessage('Pon un título a tu reseña')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('body').isString().trim().isLength({ min: 10, max: 3000 }).withMessage('Entre 10 y 3000 caracteres'),
];

const bioRules = [
  body('bio').optional().isString().trim().isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
];

module.exports = { collectErrors, registerRules, loginRules, workRules, reviewRules, bioRules };
