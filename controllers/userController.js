// Import required modules
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Utility function to filter the fields from an object
 * Allows only the specified fields to be retained in the new object
 * Used to prevent updating sensitive fields like roles or passwords
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/**
 * @desc   Get all users from the database
 * @route  GET /api/v1/users
 * @access Public (ideally should be restricted to admin)
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find(); // Fetch all users

  // Send successful response with user data
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

/**
 * @desc   Update currently logged-in user's name or email
 *         This route does NOT allow password updates
 * @route  PATCH /api/v1/users/updateMe
 * @access Private (only for logged-in users)
 */
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Throw error if user tries to update password here
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Filter only allowed fields (name and email)
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Return the modified document rather than the original
    runValidators: true, // Run schema validators on update
  });

  // Send updated user in response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/**
 * @desc   Deactivate (soft delete) currently logged-in user's account
 *         This does not remove the user from DB, just sets active to false
 * @route  DELETE /api/v1/users/deleteMe
 * @access Private (only for logged-in users)
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null, // No content
  });
});

/**
 * The following handlers are placeholders for admin-level CRUD operations
 * These routes should ideally be protected and used only by admins
 */

// Get a single user by ID (Admin functionality)
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

// Create a new user (Admin functionality)
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

// Update user data by ID (Admin functionality)
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

// Delete a user by ID (Admin functionality)
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};
