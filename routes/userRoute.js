import express from 'express';

// Controllers
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} from '../controllers/authController.js';

import {
  updateMe,
  deleteMe,
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                           AUTHENTICATION ROUTES                            */
/* -------------------------------------------------------------------------- */

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.patch('/updateMyPassword', protect, updatePassword);

/* -------------------------------------------------------------------------- */
/*                      USER ACCOUNT MANAGEMENT ROUTES                        */
/* -------------------------------------------------------------------------- */

router.patch('/updateMe', protect, updateMe);
router.delete('/deleteMe', protect, deleteMe);

/* -------------------------------------------------------------------------- */
/*                       ADMIN-LEVEL USER ROUTES                              */
/* -------------------------------------------------------------------------- */

// For admin use (optionally protect + restrictTo here)
router.route('/').get(getAllUsers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
