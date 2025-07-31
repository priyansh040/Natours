// Core dependencies
const express = require('express'); // Express framework for handling routes, middleware, etc.
const morgan = require('morgan'); // Logs HTTP requests (useful in development)
const qs = require('qs'); // Parses nested query strings like ?filter[price]=lte
const helmet = require('helmet'); // Sets secure HTTP headers
// const mongoSanitize = require('express-mongo-sanitize');

// Protects against NoSQL injection
// const xss = require('xss-clean'); // Cleans user input to prevent XSS attacks
const hpp = require('hpp'); // Prevents HTTP parameter pollution
const rateLimit = require('express-rate-limit'); // Rate limiting middleware

// Custom modules
const tourRouter = require('./routes/tourRoute'); // Routes related to tours
const userRouter = require('./routes/userRoute'); // Routes related to users
const AppError = require('./utils/appError'); // Custom error class for operational errors
const globalErrorHandler = require('./controllers/errorController'); // Global error handler middleware

// Create Express app
const app = express();

/* -------------------------------------------------------------------------- */
/*                         1) GLOBAL MIDDLEWARES                              */
/* -------------------------------------------------------------------------- */

// Set security-related HTTP headers using Helmet
app.use(helmet());

// Customize how query parameters are parsed (for deep/nested queries)
app.set('query parser', (str) => qs.parse(str));

// Enable request logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logs method, URL, response time, etc.
}

// Rate limiter: limit requests from the same IP
const limiter = rateLimit({
  max: 100, // Max requests
  windowMs: 60 * 60 * 1000, // 1 hour window
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); // Apply rate limiting to all /api routes

// Parse incoming JSON requests with a size limit
app.use(express.json({ limit: '10kb' }));

// Sanitize data against NoSQL injection (e.g., using `$gt`, `$set`, etc.)
// app.use(mongoSanitize());

// Sanitize input data to prevent XSS attacks (malicious HTML/JS)
// app.use(xss());

// Prevent HTTP parameter pollution
app.use(
  hpp({
    whitelist: [
      // Allow duplicate query params only for these fields
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Serve static files (like HTML, CSS, images) from the 'public' folder
app.use(express.static(`${__dirname}/public`));

/* -------------------------------------------------------------------------- */
/*                                2) ROUTES                                   */
/* -------------------------------------------------------------------------- */

// Mount tour routes on /api/v1/tours
app.use('/api/v1/tours', tourRouter);

// Mount user routes on /api/v1/users
app.use('/api/v1/users', userRouter);

/* -------------------------------------------------------------------------- */
/*                          3) UNHANDLED ROUTES                               */
/* -------------------------------------------------------------------------- */

// Catch all unknown routes and forward to global error handler
app.all('/{*any}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

/* -------------------------------------------------------------------------- */
/*                          4) GLOBAL ERROR HANDLER                           */
/* -------------------------------------------------------------------------- */

app.use(globalErrorHandler); // Centralized error handling middleware

// Export the app so it can be used in server.js
module.exports = app;
