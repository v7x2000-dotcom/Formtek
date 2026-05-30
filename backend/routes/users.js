const router = require('express').Router();
const { getUsers, toggleStatus, updateProfile, addAddress, deleteAddress, toggleWishlist } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getUsers);
router.put('/:id/toggle-status', protect, adminOnly, toggleStatus);
router.put('/profile', protect, updateProfile);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.post('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
