const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    work: { type: mongoose.Schema.Types.ObjectId, ref: 'Work', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    body: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
  },
  { timestamps: true },
);

// Un usuario solo puede reseñar una vez cada obra
reviewSchema.index({ work: 1, author: 1 }, { unique: true });
reviewSchema.index({ createdAt: -1 });

// Recalcula la media y el número de reseñas de una obra
reviewSchema.statics.recalculateWorkStats = async function recalculateWorkStats(workId) {
  const Work = mongoose.model('Work');
  const [stats] = await this.aggregate([
    { $match: { work: new mongoose.Types.ObjectId(String(workId)) } },
    { $group: { _id: '$work', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Work.findByIdAndUpdate(workId, {
    avgRating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
};

reviewSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Review', reviewSchema);
