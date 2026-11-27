const workService = require('../../services/workService');
const reviewService = require('../../services/reviewService');
const AppError = require('../../utils/AppError');
const { collectErrors } = require('../../validators');
const { API_PREFIX } = require('../../config/api');

const str = (v) => (typeof v === 'string' ? v : undefined);

exports.list = async (req, res) => {
  const result = await workService.list({
    q: str(req.query.q),
    type: str(req.query.type),
    genre: str(req.query.genre),
    sort: str(req.query.sort),
    page: str(req.query.page),
    limit: str(req.query.limit),
  });
  res.json(result);
};

exports.genres = async (req, res) => {
  res.json({ genres: await workService.genres() });
};

exports.get = async (req, res) => {
  const work = await workService.getById(req.params.id);
  res.json({ work });
};

exports.create = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) throw AppError.validation(errors);
  const work = await workService.create(req.body, req.user);
  res.status(201).location(`${API_PREFIX}/works/${work._id}`).json({ work });
};

exports.update = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) throw AppError.validation(errors);
  const work = await workService.update(req.params.id, req.body, req.user);
  res.json({ work });
};

exports.remove = async (req, res) => {
  await workService.remove(req.params.id, req.user);
  res.status(204).end();
};

exports.listReviews = async (req, res) => {
  await workService.getById(req.params.id); // 404 si la obra no existe
  const result = await reviewService.listByWork(req.params.id, { page: str(req.query.page), limit: str(req.query.limit) });
  res.json(result);
};

exports.createReview = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) throw AppError.validation(errors);
  const review = await reviewService.create(req.params.id, req.body, req.user);
  res.status(201).location(`${API_PREFIX}/reviews/${review._id}`).json({ review });
};
