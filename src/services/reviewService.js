const mongoose = require('mongoose');
const Review = require('../models/Review');
const Work = require('../models/Work');
const AppError = require('../utils/AppError');

const pickReviewFields = (data) => ({
  rating: Number(data.rating),
  title: data.title,
  body: data.body,
});

const isAuthor = (review, user) => !!user && String(review.author?._id || review.author) === String(user._id);
const canEdit = (review, user) => isAuthor(review, user);
const canDelete = (review, user) => isAuthor(review, user) || (!!user && user.role === 'admin');

async function getById(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Reseña no encontrada');
  const review = await Review.findById(id).populate('author', 'username').populate('work', 'title type');
  if (!review) throw AppError.notFound('Reseña no encontrada');
  return review;
}

async function listByWork(workId, { page = 1, limit = 20 } = {}) {
  if (!mongoose.isValidObjectId(workId)) throw AppError.notFound('Obra no encontrada');
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const filter = { work: workId };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * perPage).limit(perPage)
      .populate('author', 'username').lean(),
    Review.countDocuments(filter),
  ]);
  return { items, total, page: pageNum, pages: Math.max(1, Math.ceil(total / perPage)) };
}

async function listLatest(limit = 6) {
  return Review.find().sort({ createdAt: -1 }).limit(limit)
    .populate('author', 'username').populate('work', 'title type').lean();
}

async function listByUser(userId) {
  return Review.find({ author: userId }).sort({ createdAt: -1 }).populate('work', 'title type').lean();
}

async function findUserReview(workId, userId) {
  if (!userId) return null;
  return Review.findOne({ work: workId, author: userId }).lean();
}

async function create(workId, data, user) {
  if (!mongoose.isValidObjectId(workId) || !(await Work.exists({ _id: workId }))) {
    throw AppError.notFound('Obra no encontrada');
  }
  try {
    const review = await Review.create({ ...pickReviewFields(data), work: workId, author: user._id });
    await Review.recalculateWorkStats(workId);
    return review;
  } catch (err) {
    if (err.code === 11000) throw AppError.conflict('Ya has reseñado esta obra; puedes editar tu reseña');
    throw err;
  }
}

async function update(id, data, user) {
  const review = await getById(id);
  if (!canEdit(review, user)) throw AppError.forbidden('Solo el autor puede editar su reseña');
  Object.assign(review, pickReviewFields(data));
  await review.save();
  await Review.recalculateWorkStats(review.work._id);
  return review;
}

async function remove(id, user) {
  const review = await getById(id);
  if (!canDelete(review, user)) throw AppError.forbidden('No puedes borrar esta reseña');
  const workId = review.work._id;
  await review.deleteOne();
  await Review.recalculateWorkStats(workId);
  return review;
}

module.exports = {
  getById, listByWork, listLatest, listByUser, findUserReview, create, update, remove, canEdit, canDelete,
};
