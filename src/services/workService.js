const mongoose = require('mongoose');
const Work = require('../models/Work');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const { escapeRegex, parseGenres } = require('../utils/helpers');

const SORTS = {
  recientes: { createdAt: -1 },
  valoracion: { avgRating: -1, reviewCount: -1 },
  populares: { reviewCount: -1, avgRating: -1 },
  titulo: { title: 1 },
};

// Campos que el cliente puede fijar (protección contra asignación masiva)
function pickWorkFields(data) {
  const out = {
    title: data.title,
    type: data.type,
    creator: data.creator,
    year: data.year ? Number(data.year) : null,
    genres: parseGenres(data.genres),
    synopsis: data.synopsis || '',
    coverUrl: data.coverUrl || '',
  };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}

const isAdmin = (user) => !!user && user.role === 'admin';
const isOwner = (work, user) => !!user && String(work.createdBy?._id || work.createdBy) === String(user._id);
const canEdit = (work, user) => isAdmin(user) || isOwner(work, user);
const canDelete = (_work, user) => isAdmin(user);

async function list({ q, type, genre, sort, page = 1, limit = 12 } = {}) {
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
    filter.$or = [{ title: rx }, { creator: rx }];
  }
  if (type && Work.TYPES.includes(String(type))) filter.type = String(type);
  if (genre) filter.genres = String(genre).toLowerCase();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const sortKey = SORTS[sort] ? sort : 'recientes';

  const [items, total] = await Promise.all([
    Work.find(filter).sort(SORTS[sortKey]).skip((pageNum - 1) * perPage).limit(perPage).lean(),
    Work.countDocuments(filter),
  ]);
  return { items, total, page: pageNum, pages: Math.max(1, Math.ceil(total / perPage)), limit: perPage, sort: sortKey };
}

async function getById(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Obra no encontrada');
  const work = await Work.findById(id).populate('createdBy', 'username');
  if (!work) throw AppError.notFound('Obra no encontrada');
  return work;
}

async function topRated(limit = 6) {
  return Work.find({ reviewCount: { $gt: 0 } }).sort(SORTS.valoracion).limit(limit).lean();
}

async function genres() {
  const list = await Work.distinct('genres');
  return list.sort((a, b) => a.localeCompare(b, 'es'));
}

async function create(data, user) {
  return Work.create({ ...pickWorkFields(data), createdBy: user._id });
}

async function update(id, data, user) {
  const work = await getById(id);
  if (!canEdit(work, user)) throw AppError.forbidden('Solo quien creó la obra o un administrador puede editarla');
  Object.assign(work, pickWorkFields(data));
  await work.save();
  return work;
}

async function remove(id, user) {
  const work = await getById(id);
  if (!canDelete(work, user)) throw AppError.forbidden('Solo un administrador puede borrar obras');
  await Review.deleteMany({ work: work._id });
  await work.deleteOne();
  return work;
}

module.exports = { list, getById, topRated, genres, create, update, remove, canEdit, canDelete, SORTS };
