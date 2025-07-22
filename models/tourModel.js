const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have name and unique'],
    unique: true,
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have duration'],
  },

  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have difficulty'],
  },
  ratingsAverage: {
    type: Number,
    required: [true, 'A tour must have ratings average'],
  },
  ratingsQuantity: {
    type: Number,
    required: [true, 'A tour must have ratings Qunatity'],
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have summary'],
  },
  description: {
    type: String,
    name: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  startDates: [Date],
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
