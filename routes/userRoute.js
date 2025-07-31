const express = require('express');

// Controllers
const userController = require('../controllers/userController'); // Handles user data CRUD operations
const authController = require('../controllers/authController'); // Handles signup/login/authentication

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                           AUTHENTICATION ROUTES                            */
/* -------------------------------------------------------------------------- */

// Route to register a new user
router.post('/signup', authController.signup);

// Route to log in an existing user
router.post('/login', authController.login);

// Route to initiate password reset (send reset token via email)
router.post('/forgotPassword', authController.forgotPassword);

// Route to reset password using the token sent in email
router.patch('/resetPassword/:token', authController.resetPassword);

// Route to update the currently logged-in user's password
// User must be authenticated
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

/* -------------------------------------------------------------------------- */
/*                      USER ACCOUNT MANAGEMENT ROUTES                        */
/* -------------------------------------------------------------------------- */

// Update current user's own data (e.g., name, email)
// Requires authentication
router.patch('/updateMe', authController.protect, userController.updateMe);

// Deactivate (soft-delete) the current user's account
// Requires authentication
router.delete('/deleteMe', authController.protect, userController.deleteMe);

/* -------------------------------------------------------------------------- */
/*                       ADMIN-LEVEL USER ROUTES                              */
/* -------------------------------------------------------------------------- */

// These routes should ideally be protected using role-based access (e.g., admin)
// You can add `authController.protect` and `authController.restrictTo('admin')` here if needed

// Get all users or create a new user (typically for admin panel)
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

// Get, update, or delete a specific user by ID
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

/* -------------------------------------------------------------------------- */
/*                            EXPORT THE ROUTER                               */
/* -------------------------------------------------------------------------- */

module.exports = router;
