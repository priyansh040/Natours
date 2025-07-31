const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator'); // Uncomment if you want to validate only alphabetic names

// Defining the schema for the Tour model
const tourSchema = new mongoose.Schema(
  {
    // Tour name - must be unique, trimmed, and within character limits
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },

    // Slug version of the name for URLs (e.g., "The Forest Hiker" => "the-forest-hiker")
    slug: String,

    // Duration of the tour in days
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    // Maximum group size allowed on the tour
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    // Difficulty level of the tour (must be one of the allowed values)
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    // Average rating for the tour, defaults to 4.5
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },

    // Total number of ratings for the tour
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    // Price of the tour
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    // Discounted price (must be less than actual price)
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // Works only on new document creation (not on update)
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },

    // Short summary of the tour
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },

    // Detailed description of the tour
    description: {
      type: String,
      trim: true,
    },

    // Name of the cover image file (must be provided)
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    // Array of image file names
    images: [String],

    // Timestamp of when the tour was created (not selected in queries)
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    // Start dates of the tour
    startDates: [Date],

    // Marks whether this is a secret tour (used to hide from public queries)
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Options to include virtual properties in the JSON and object output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// VIRTUAL PROPERTY: Not saved in DB, but accessible as a calculated field
// Converts duration in days to weeks
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

///////////////////////////////////////////////////////
// MONGOOSE MIDDLEWARES
///////////////////////////////////////////////////////

// DOCUMENT MIDDLEWARE: Runs before .save() and .create()
tourSchema.pre('save', function (next) {
  // Generate slug from tour name
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE: Runs before any find() query (like find, findOne, findById)
tourSchema.pre(/^find/, function (next) {
  // Exclude secret tours from results
  this.find({ secretTour: { $ne: true } });

  // Store start time to log query duration
  this.start = Date.now();
  next();
});

// Runs after query is executed
tourSchema.post(/^find/, function (docs, next) {
  // Log how long the query took
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE: Runs before aggregation pipeline is executed
tourSchema.pre('aggregate', function (next) {
  // Add a match stage to exclude secret tours
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

// Creating and exporting the model based on the schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
