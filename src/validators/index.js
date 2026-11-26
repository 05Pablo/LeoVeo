const { body, validationResult } = require('express-validator');

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

module.exports = { collectErrors, registerRules, loginRules };
