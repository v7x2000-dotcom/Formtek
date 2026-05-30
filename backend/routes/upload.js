const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { uploadProductImages, uploadAvatar, uploadPaymentProof, handleMulterError, isCloudinary } = require('../middleware/upload');

// Upload product images (Admin only)
router.post('/product-images', protect, adminOnly, uploadProductImages, handleMulterError, (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'لم يتم رفع أي صور' });
  }

  // Cloudinary returns full URL in file.path; local multer returns filename
  const urls = req.files.map(f => isCloudinary() ? f.path : `/uploads/products/${f.filename}`);
  res.json({ success: true, message: 'تم رفع الصور بنجاح ✅', urls });
});

// Upload avatar (Authenticated)
router.post('/avatar', protect, uploadAvatar, handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع الصورة' });
  const url = isCloudinary() ? req.file.path : `/uploads/avatars/${req.file.filename}`;
  res.json({ success: true, url });
});

// Upload payment proof
router.post('/payment-proof', uploadPaymentProof, handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع صورة التحويل' });
  const url = isCloudinary() ? req.file.path : `/uploads/payment-proofs/${req.file.filename}`;
  res.json({ success: true, url });
});

module.exports = router;
