// Built-in Node.js module for generating secure random values and hashes
const crypto = require('crypto');
// Promisify callback-based functions (used for jwt.verify)
const { promisify } = require('util');
// JWT for signing and verifying tokens
const jwt = require('jsonwebtoken');

// Import User model and utility functions
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// ✅ 1. Helper function to create a JWT token from a user's ID
const signToken = (id) =>
  jwt.sign(
    { id }, // Payload: we include only the user ID in the token
    process.env.JWT_SECRET, // Secret key used to sign the token (stored in .env)
    {
      expiresIn: process.env.JWT_EXPIRES_IN, // Token expiration time, like "90d"
    },
  );

// ✅ 2. Function that creates token, stores it in a secure cookie, and sends the response
const createSendToken = (user, statusCode, res) => {
  // 🔐 Generate a signed JWT using the user ID
  const token = signToken(user._id);

  // 🍪 Define cookie settings to store the JWT on the client
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // ⛔️ Prevents JavaScript on the browser from accessing the cookie (security)
    httpOnly: true,
  };

  // ✅ In production (e.g., deployed on real server), send cookies only over HTTPS
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // 📦 Set the cookie named 'jwt' with the token value and defined settings
  res.cookie('jwt', token, cookieOptions);

  // ❌ Don't send password in the response even though it's in the DB
  user.password = undefined;

  // ✅ Send final JSON response to the client with token and user info (no password)
  res.status(statusCode).json({
    status: 'success',
    token, // also include token in the body (helpful for mobile apps)
    data: {
      user, // user info, but password is removed
    },
  });
};

/**
 * Route handler for user signup
 */
exports.signup = catchAsync(async (req, res, next) => {
  // Create new user with only allowed fields (not role/admin fields)
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

/**
 * Route handler for user login
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Find user and explicitly select password
  const user = await User.findOne({ email }).select('+password');

  // 3) Check if password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4) If everything is correct, send token
  createSendToken(user, 200, res);
});

/**
 * Middleware to protect routes - verifies JWT and user validity
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If token is missing
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // 2) Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  // Grant access to the protected route
  req.user = currentUser;
  next();
});

/**
 * Middleware to restrict actions to certain roles (e.g., 'admin')
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

/**
 * Handler for "Forgot Password" flow – generates and emails a reset token
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate random reset token and save hashed version to DB
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send token via email as URL
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:\n${resetURL}\n\nIf you didn’t request this, just ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // Reset token fields if email fails to send
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});

/**
 * Handler for resetting the password using token
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Hash token from URL to match stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 3) Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Log user in again
  createSendToken(user, 200, res);
});

/**
 * Handler for updating the currently logged-in user's password
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user and explicitly select password
  const user = await User.findById(req.user.id).select('+password');

  // 2) Verify current password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) Set new password and save
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // ⚠️ Do NOT use findByIdAndUpdate – it skips validators & pre-save hooks

  // 4) Log user in with new password
  createSendToken(user, 200, res);
});
