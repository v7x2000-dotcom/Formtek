const jwt = require('jsonwebtoken');

// Protect any route
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'غير مصرح. يرجى تسجيل الدخول أولاً.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const User = require('../models/User');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'جلسة المستخدم منتهية' });
    
    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'تم تعليق هذا الحساب. يرجى التواصل مع الدعم.' });
    }
    
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'رمز التحقق غير صالح' });
  }
};

// Optional auth (attach user if token present)
exports.optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('../models/User');
      req.user = await User.findById(decoded.id).select('-password');
    } catch { /* ignore */ }
  }
  next();
};

// Admin only
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'هذا الإجراء مخصص للمسؤولين فقط' });
  }
  next();
};
