const router = require('express').Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, addReview, deleteReview, getAllReviews, updateReviewStatus } = require('../controllers/productController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/reviews/all', protect, adminOnly, getAllReviews);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/reviews', protect, addReview);
router.delete('/:id/reviews/:reviewId', protect, adminOnly, deleteReview);
router.put('/:id/reviews/:reviewId/status', protect, adminOnly, updateReviewStatus);

module.exports = router;
