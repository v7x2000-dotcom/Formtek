const logActivity = require('../utils/logger');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).select('-password');
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

// @desc    Toggle user active/blocked status (Admin)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleStatus = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'لا يمكن تعليق حساب المسؤول' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    global.io?.emit('user_status_changed', { userId: user._id, isActive: user.isActive });
    await logActivity('تعديل حالة حساب مستخدم', `تم تغيير حالة حساب "${user.name}" إلى ${user.isActive ? 'نشط' : 'محظور'}`, user.isActive ? 'info' : 'warning', req.user, req.ip);
    res.json({ success: true, message: user.isActive ? 'تم تفعيل الحساب ✅' : 'تم تعليق الحساب ⚠️', isActive: user.isActive });
  } catch (err) { next(err); }
};

// @desc    Delete user permanently (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'لا يمكن حذف حساب المسؤول' });
    if (user._id.toString() === req.user.id) return res.status(403).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });

    // Delete user's orders too
    await Order.deleteMany({ user: user._id });

    const deletedName = user.name;
    const deletedEmail = user.email;
    await User.findByIdAndDelete(req.params.id);

    global.io?.emit('user_change', { type: 'delete', userId: req.params.id });
    await logActivity('حذف حساب مستخدم', `تم حذف حساب "${deletedName}" (${deletedEmail}) نهائياً من قِبل الأدمن`, 'danger', req.user, req.ip);

    res.json({ success: true, message: `تم حذف حساب "${deletedName}" بنجاح 🗑️` });
  } catch (err) { next(err); }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;

    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name: name.trim() }), ...(phone !== undefined && { phone }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم تحديث البيانات بنجاح ✅', user });
  } catch (err) { next(err); }
};

// @desc    Add/update address
// @route   POST /api/users/address
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const { label, city, details } = req.body;
    if (!city || !details) return res.status(400).json({ success: false, message: 'يرجى إدخال المدينة والتفاصيل' });

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    user.addresses.push({ label: label || 'المنزل', city, details });
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'تم إضافة العنوان بنجاح ✅', addresses: user.addresses });
  } catch (err) { next(err); }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    const beforeLen = user.addresses.length;
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    if (user.addresses.length === beforeLen) return res.status(404).json({ success: false, message: 'العنوان غير موجود' });
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'تم حذف العنوان بنجاح', addresses: user.addresses });
  } catch (err) { next(err); }
};

// @desc    Toggle wishlist product
// @route   POST /api/users/wishlist/:productId
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    const pid = req.params.productId;
    const idx = user.wishlist.findIndex(id => id.toString() === pid);
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      await user.save({ validateBeforeSave: false });
      return res.json({ success: true, message: 'تم إزالة المنتج من المفضلة', inWishlist: false });
    }
    user.wishlist.push(pid);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'تم إضافة المنتج إلى المفضلة ❤️', inWishlist: true });
  } catch (err) { next(err); }
};
