const router = require('express').Router();
const path = require('path');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadProductImages, uploadAvatar, uploadPaymentProof, handleMulterError } = require('../middleware/upload');

// Upload product images (Admin only)
router.post('/product-images', protect, adminOnly, uploadProductImages, handleMulterError, (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'لم يتم رفع أي صور' });
  }
  const urls = req.files.map(f => `/uploads/products/${f.filename}`);
  res.json({ success: true, message: 'تم رفع الصور بنجاح', urls });
});

// Upload avatar (Authenticated)
router.post('/avatar', protect, uploadAvatar, handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع الصورة' });
  res.json({ success: true, url: `/uploads/avatars/${req.file.filename}` });
});

// Upload payment proof (Public for orders)
router.post('/payment-proof', uploadPaymentProof, handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع صورة التحويل' });
  res.json({ success: true, url: `/uploads/payment-proofs/${req.file.filename}` });
});

module.exports = router;
