const router = require('express').Router();
const ActivityLog = require('../models/ActivityLog');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get all activity logs (Admin only)
// @route   GET /api/logs
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

// @desc    Clear all activity logs (Admin only)
// @route   DELETE /api/logs
// @access  Private/Admin
router.delete('/', protect, adminOnly, async (req, res, next) => {
  try {
    await ActivityLog.deleteMany({});
    res.json({ success: true, message: 'تم تفريغ سجل العمليات بنجاح ✅' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
