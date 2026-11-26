const reviewService = require('../services/reviewService');
const AppError = require('../utils/AppError');
const { collectErrors } = require('../validators');
const { renderShow } = require('./workController');

const values = (b = {}) => ({ rating: b.rating || '', title: b.title || '', body: b.body || '' });

exports.create = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) {
    return renderShow(req, res, { reviewErrors: errors, reviewValues: values(req.body), status: 422 });
  }
  try {
    await reviewService.create(req.params.id, req.body, req.user);
  } catch (err) {
    if (err instanceof AppError && err.status === 409) {
      req.flash('error', err.message);
      return res.redirect(`/works/${req.params.id}`);
    }
    throw err;
  }
  req.flash('success', '¡Gracias por tu reseña!');
  return res.redirect(`/works/${req.params.id}#resenas`);
};

exports.showEdit = async (req, res) => {
  const review = await reviewService.getById(req.params.id);
  if (!reviewService.canEdit(review, req.user)) throw AppError.forbidden('Solo el autor puede editar su reseña');
  res.render('reviews/edit', { title: 'Editar reseña', review, values: values(review), errors: {} });
};

exports.update = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) {
    const review = await reviewService.getById(req.params.id);
    return res.status(422).render('reviews/edit', { title: 'Editar reseña', review, values: values(req.body), errors });
  }
  const review = await reviewService.update(req.params.id, req.body, req.user);
  req.flash('success', 'Reseña actualizada');
  return res.redirect(`/works/${review.work._id}#resenas`);
};

exports.destroy = async (req, res) => {
  const review = await reviewService.remove(req.params.id, req.user);
  req.flash('success', 'Reseña eliminada');
  // Vuelve a la página desde la que se borró (obra o perfil) si es interna
  const back = req.body.redirectTo;
  res.redirect(typeof back === 'string' && /^\/(works|users)\/[\w-]+$/.test(back) ? back : `/works/${review.work._id}`);
};
