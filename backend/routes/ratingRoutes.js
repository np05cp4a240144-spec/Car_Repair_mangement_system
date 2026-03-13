const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { submitRating, getMyRatings, getAllRatings, getRatingSummary } = require('../controllers/ratingController');

router.post('/', protect, submitRating);
router.get('/my', protect, getMyRatings);
router.get('/summary', protect, admin, getRatingSummary);
router.get('/', protect, admin, getAllRatings);

module.exports = router;
