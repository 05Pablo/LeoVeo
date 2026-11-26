const reviewService = require('../../services/reviewService');
const AppError = require('../../utils/AppError');
const { collectErrors } = require('../../validators');

exports.latest = async (req, res) => {
  res.json({ items: await reviewService.listLatest(10) });
};

exports.get = async (req, res) => {
  res.json({ review: await reviewService.getById(req.params.id) });
};

exports.update = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) throw AppError.validation(errors);
  const review = await reviewService.update(req.params.id, req.body, req.user);
  res.json({ review });
};

exports.remove = async (req, res) => {
  await reviewService.remove(req.params.id, req.user);
  res.status(204).end();
};
