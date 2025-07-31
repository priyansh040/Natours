// Importing custom error handling class
const AppError = require('../utils/appError');

/**
 * Handle Mongoose CastError (e.g., invalid MongoDB ID)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * Handle duplicate field values in MongoDB (e.g., duplicate email)
 */
const handleDuplicateFieldsDB = (err) => {
  // Extract duplicate value from the error message using regex
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose validation errors (e.g., missing required fields)
 */
const handleValidationErrorDB = (err) => {
  // Collect all error messages into a single string
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle invalid JWT
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * Handle expired JWT
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Send detailed error response in development environment
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err, // Full error object
    message: err.message,
    stack: err.stack, // Stack trace for debugging
  });
};

/**
 * Send minimal error details in production (to avoid leaking info)
 */
const sendErrorProd = (err, res) => {
  // Operational error: show client the message
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Unknown or programming error: don’t leak details
  } else {
    // 1) Log the error for debugging
    console.error('ERROR 💥', err);

    // 2) Send a generic message to the client
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

/**
 * Global error-handling middleware
 */
module.exports = (err, req, res, next) => {
  // Set default error status and code if not already set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Environment-specific error handling
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    // Manually copy the message property for known errors
    error.message = err.message;

    // Handle specific known error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
