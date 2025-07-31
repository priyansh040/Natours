const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Middleware to preset query parameters for top-5-cheap-tours route.
 * This acts as an alias for a specific query.
 */
exports.aliasTopCheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

/**
 * Get all tours with advanced filtering, sorting, pagination, and field limiting.
 */
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Chainable query features handled by APIFeatures class
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

/**
 * Get a single tour by ID.
 */
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

/**
 * Create a new tour.
 */
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

/**
 * Update a tour by ID.
 */
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated document
    runValidators: true, // Validate update input
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

/**
 * Delete a tour by ID.
 */
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Get tour statistics (e.g., average price, rating) grouped by difficulty.
 */
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      // Only include tours with rating >= 4.5
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      // Group by difficulty
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // Sort by average price ascending
      $sort: { avgPrice: 1 },
    },
    // Optional additional match can go here
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

/**
 * Get monthly plan of tour starts for a specific year.
 */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // Convert string to number

  const plan = await Tour.aggregate([
    {
      // Deconstruct array to individual dates
      $unwind: '$startDates',
    },
    {
      // Match tours in the given year
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      // Group by month
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      // Add field "month"
      $addFields: { month: '$_id' },
    },
    {
      // Remove _id field from output
      $project: {
        _id: 0,
      },
    },
    {
      // Sort by most tour starts
      $sort: { numTourStarts: -1 },
    },
    {
      // Limit to 12 results (1 per month)
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
