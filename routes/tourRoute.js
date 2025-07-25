const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// Custom route to get top-5-cheap-tours
router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTopCheapTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
