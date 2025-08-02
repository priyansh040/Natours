// Import required modules
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

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
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find(); // Fetch all users

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
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

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
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * Admin-level routes: Not implemented yet
 */
export const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

export const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

export const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

export const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};
