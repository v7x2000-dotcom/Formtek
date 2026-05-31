const router = require('express').Router();
const { createOrder, getOrders, getMyOrders, getOrder, updateStatus, deleteOrder, getStats } = require('../controllers/orderController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, getStats);
router.get('/my', protect, getMyOrders);
router.get('/', protect, adminOnly, getOrders);
router.get('/:id', protect, getOrder);
router.post('/', protect, createOrder);
router.put('/:id/status', protect, adminOnly, updateStatus);
router.delete('/:id', protect, adminOnly, deleteOrder);

module.exports = router;
