const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');

async function getProfile(username) {
  const user = await User.findOne({ username: String(username) }).lean();
  if (!user) throw AppError.notFound('Usuario no encontrado');
  const reviews = await Review.find({ author: user._id }).sort({ createdAt: -1 })
    .populate('work', 'title type').lean();
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  delete user.passwordHash;
  return {
    user,
    reviews,
    stats: { reviewCount: reviews.length, avgRating: Math.round(avg * 10) / 10 },
  };
}

async function updateBio(user, bio) {
  return User.findByIdAndUpdate(user._id, { bio: String(bio || '').slice(0, 300) }, { new: true, runValidators: true });
}


module.exports = { getProfile, updateBio };
