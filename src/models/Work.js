const mongoose = require('mongoose');

const TYPES = ['pelicula', 'libro'];

// Obra reseñable: una película o un libro
const workSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    type: { type: String, required: true, enum: TYPES },
    // Director (películas) o autor (libros)
    creator: { type: String, required: true, trim: true, maxlength: 100 },
    year: { type: Number, min: 1800, max: 2100 },
    genres: { type: [String], default: [] },
    synopsis: { type: String, trim: true, maxlength: 2000, default: '' },
    coverUrl: { type: String, trim: true, maxlength: 500, default: '' },
    // Campos desnormalizados: se recalculan cada vez que cambia una reseña
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

workSchema.index({ type: 1, avgRating: -1 });
workSchema.index({ genres: 1 });
workSchema.index({ title: 1 });

workSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Work', workSchema);
module.exports.TYPES = TYPES;
