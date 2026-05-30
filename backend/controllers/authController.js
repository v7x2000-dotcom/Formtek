const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logActivity = require('../utils/logger');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};


// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'الاسم الكامل مطلوب' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'الاسم يجب أن يكون ثنائي الأحرف على الأقل' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صالح' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // ── NORMAL MODE: DB connected ─────────────────────────────────────────────
    const User = require('../models/User');

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, phone: phone || '' });
    const token = generateToken(user._id, user.role);

    // Broadcast WebSocket event
    global.io?.emit('user_change', { type: 'register', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });

    // Log activity
    await logActivity(
      'تسجيل مستخدم جديد',
      `سجل مستخدم جديد حساباً باسم: "${user.name}" وبريد: ${user.email}`,
      'success',
      user,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح 🎉',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صالح' });
    }

    // ── NORMAL MODE: DB connected ─────────────────────────────────────────────
    const User = require('../models/User');
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'تم تعليق هذا الحساب. يرجى التواصل مع الدعم.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    // Broadcast WebSocket event
    global.io?.emit('user_change', { type: 'login', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });

    // Log activity
    await logActivity(
      'تسجيل دخول',
      `قام "${user.name}" بتسجيل الدخول إلى حسابه`,
      'info',
      user,
      req.ip
    );

    res.json({
      success: true,
      message: `مرحباً بعودتك، ${user.name} 👋`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        wishlist: user.wishlist
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {

    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('wishlist', 'name price image');
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    // ── NORMAL MODE: DB connected ─────────────────────────────────────────────
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    user.password = newPassword;
    await user.save();

    // Log activity
    await logActivity(
      'تغيير كلمة المرور',
      `قام "${user.name}" بتحديث كلمة مرور حسابه`,
      'info',
      user,
      req.ip
    );

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح ✅' });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      global.io?.emit('user_change', { type: 'logout', userId: req.user.id });
      await logActivity(
        'تسجيل خروج',
        `قام "${req.user.name}" بتسجيل الخروج من الحساب`,
        'info',
        req.user,
        req.ip
      );
    }
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح 👋' });
  } catch (err) {
    next(err);
  }
};
