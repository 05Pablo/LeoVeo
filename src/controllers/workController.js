const workService = require('../services/workService');
const reviewService = require('../services/reviewService');
const { collectErrors } = require('../validators');

const formValues = (body = {}) => ({
  title: body.title || '',
  type: body.type || 'pelicula',
  creator: body.creator || '',
  year: body.year || '',
  genres: Array.isArray(body.genres) ? body.genres.join(', ') : (body.genres || ''),
  synopsis: body.synopsis || '',
  coverUrl: body.coverUrl || '',
});

exports.home = async (req, res) => {
  const [topRated, latestReviews, latest] = await Promise.all([
    workService.topRated(6),
    reviewService.listLatest(6),
    workService.list({ sort: 'recientes', limit: 6 }),
  ]);
  res.render('home', { title: 'Inicio', topRated, latestReviews, latestWorks: latest.items });
};

exports.index = async (req, res) => {
  const filters = {
    q: typeof req.query.q === 'string' ? req.query.q.trim() : '',
    type: typeof req.query.type === 'string' ? req.query.type : '',
    genre: typeof req.query.genre === 'string' ? req.query.genre : '',
    sort: typeof req.query.sort === 'string' ? req.query.sort : 'recientes',
  };
  const [result, genres] = await Promise.all([
    workService.list({ ...filters, page: req.query.page }),
    workService.genres(),
  ]);
  res.render('works/index', { title: 'Explorar', result, genres, filters, sorts: Object.keys(workService.SORTS) });
};

// Detalle de una obra. Lo reutiliza el controlador de reseñas para volver a
// pintar la página con los errores del formulario de reseña.
async function renderShow(req, res, { reviewErrors = {}, reviewValues = {}, status = 200 } = {}) {
  const work = await workService.getById(req.params.id);
  const [reviews, userReview] = await Promise.all([
    reviewService.listByWork(work._id, { page: req.query.page }),
    reviewService.findUserReview(work._id, req.user && req.user._id),
  ]);
  return res.status(status).render('works/show', {
    title: work.title,
    work,
    reviews,
    userReview,
    canEdit: workService.canEdit(work, req.user),
    canDelete: workService.canDelete(work, req.user),
    reviewErrors,
    reviewValues,
  });
}
exports.renderShow = renderShow;
exports.show = (req, res) => renderShow(req, res);

exports.showNew = (req, res) => {
  res.render('works/form', { title: 'Añadir obra', work: null, values: formValues(), errors: {} });
};

exports.create = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) {
    return res.status(422).render('works/form', { title: 'Añadir obra', work: null, values: formValues(req.body), errors });
  }
  const work = await workService.create(req.body, req.user);
  req.flash('success', 'Obra añadida. ¡Escribe la primera reseña!');
  return res.redirect(`/works/${work._id}`);
};

exports.showEdit = async (req, res) => {
  const work = await workService.getById(req.params.id);
  if (!workService.canEdit(work, req.user)) {
    req.flash('error', 'No puedes editar esta obra');
    return res.redirect(`/works/${work._id}`);
  }
  return res.render('works/form', { title: `Editar: ${work.title}`, work, values: formValues(work.toObject()), errors: {} });
};

exports.update = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) {
    const work = await workService.getById(req.params.id);
    return res.status(422).render('works/form', { title: `Editar: ${work.title}`, work, values: formValues(req.body), errors });
  }
  const work = await workService.update(req.params.id, req.body, req.user);
  req.flash('success', 'Obra actualizada');
  return res.redirect(`/works/${work._id}`);
};

exports.destroy = async (req, res) => {
  const work = await workService.remove(req.params.id, req.user);
  req.flash('success', `"${work.title}" se ha eliminado junto con sus reseñas`);
  res.redirect('/works');
};
