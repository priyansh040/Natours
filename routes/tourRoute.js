import express from 'express';

// Controller modules for business logic
import * as tourController from '../controllers/tourController.js';
import * as authController from '../controllers/authController.js';

// Create a new router instance
const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                         CUSTOM ALIAS ROUTE                                 */
/* -------------------------------------------------------------------------- */

// Preconfigured query params for top 5 cheap tours
// This route uses middleware `aliasTopCheapTours` to set filters/sort/limit before calling getAllTours
router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTopCheapTours, tourController.getAllTours);

/* -------------------------------------------------------------------------- */
/*                         AGGREGATION ROUTES                                 */
/* -------------------------------------------------------------------------- */

// Get statistical summary of tours (average price, ratings, etc.)
router.route('/tour-stats').get(tourController.getTourStats);

// Get a monthly plan for tours in a specific year (e.g., /monthly-plan/2025)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

/* -------------------------------------------------------------------------- */
/*                             STANDARD ROUTES                                */
/* -------------------------------------------------------------------------- */

// Get all tours (protected route) or create a new tour
router
  .route('/')
  .get(authController.protect, tourController.getAllTours) // Only accessible to logged-in users
  .post(tourController.createTour); // Create a tour (authentication can be added later if needed)

// Get, update, or delete a tour by ID
router
  .route('/:id')
  .get(tourController.getTour) // Get a single tour by ID
  .patch(tourController.updateTour) // Update specific fields of a tour
  .delete(
    authController.protect, // Require authentication
    authController.restrictTo('admin', 'lead-guide'), // Only admins & lead-guides can delete
    tourController.deleteTour,
  );

/* -------------------------------------------------------------------------- */
/*                            EXPORT THE ROUTER                               */
/* -------------------------------------------------------------------------- */

export default router;
