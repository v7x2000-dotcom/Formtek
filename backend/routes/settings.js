const router = require('express').Router();
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');
const logActivity = require('../utils/logger');

const defaultSettings = {
  _id: 'default_store_settings',
  key: 'store_settings',
  slides: [
    {
      title: "قوة الأداء الرياضي",
      subtitle: "اكتشف تشكيلة واسعة من البروتينات والمكملات الغذائية لدعم نمو عضلاتك.",
      img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
      link: "#"
    },
    {
      title: "أحزمة ومعدات احترافية",
      subtitle: "ارفع بأمان مع أحزمة رفع الأثقال ومعدات التمرين المصممة لتدوم.",
      img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1200&auto=format&fit=crop",
      link: "#"
    }
  ],
  faqs: [
    {
      q: "ما هي مدة التوصيل المتوقعة؟",
      a: "يتم توصيل جميع الطلبات خلال 24 إلى 48 ساعة عمل كحد أقصى لجميع محافظات مصر.",
      category: "shipping"
    },
    {
      q: "كيف يمكنني تتبع طلبي؟",
      a: "يمكنك تتبع شحنتك مباشرة من خلال صفحة ملفك الشخصي في قسم 'طلباتي السابقة تتبعها'.",
      category: "orders"
    }
  ],
  footer: {
    about: "متجر فورمتك للمكملات الغذائية والأجهزة الرياضية ذات الجودة العالية.",
    address: "القاهرة، مصر",
    phone: "01000000000",
    email: "support@formtek.com",
    workingHours: "طوال أيام الأسبوع من الساعة 9 صباحاً حتى 10 مساءً",
    socialLinks: { facebook: "#", instagram: "#", whatsapp: "#" }
  }
};

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'store_settings' });
    if (!settings) {
      settings = await Settings.create(defaultSettings);
    }
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

// @desc    Update store settings (Admin only)
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { slides, faqs, footer } = req.body;

    let settings = await Settings.findOne({ key: 'store_settings' });
    if (!settings) {
      settings = new Settings({ key: 'store_settings' });
    }
    if (slides) settings.slides = slides;
    if (faqs) settings.faqs = faqs;
    if (footer) settings.footer = footer;

    await settings.save();

    // Log administrative activity
    await logActivity(
      'تحديث إعدادات المتجر',
      'تم تحديث إعدادات المتجر العامة (الواجهة / الأسئلة الشائعة / الفوتر) من قبل المسؤول',
      'info',
      req.user,
      req.ip
    );

    // Broadcast update via WebSockets to all connected clients
    global.io?.emit('settings_change', settings);

    res.json({ success: true, message: 'تم تحديث إعدادات المتجر بنجاح ✅', settings });
  } catch (err) {
    next(err);
  }
});

// @desc    Clean all mock/test data from DB (Admin only)
// @route   POST /api/settings/clean-mock-data
// @access  Private/Admin
router.post('/clean-mock-data', protect, adminOnly, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const ActivityLog = require('../models/ActivityLog');
    const Message = require('../models/Message');

    // 1. Delete all users except admin users
    const usersResult = await User.deleteMany({ role: { $ne: 'admin' } });

    // 2. Delete all orders
    const ordersResult = await Order.deleteMany({});

    // 3. Delete all products (clean catalog slate)
    const productsResult = await Product.deleteMany({});

    // 4. Delete all messages
    const messagesResult = await Message.deleteMany({});

    // 5. Delete all activity logs except we will log this reset action
    await ActivityLog.deleteMany({});

    // Log this DB clean action
    await logActivity(
      'تنظيف قاعدة البيانات',
      `تم تنظيف كافة البيانات التجريبية بنجاح. تم حذف: ${usersResult.deletedCount} مستخدم، ${ordersResult.deletedCount} طلب، ${productsResult.deletedCount} منتج.`,
      'danger',
      req.user,
      req.ip
    );

    // Emit WebSocket changes so connected interfaces reflect changes immediately
    global.io?.emit('user_change', { type: 'reset' });
    global.io?.emit('product_change', { type: 'reset' });
    global.io?.emit('order_change', { type: 'reset' });
    global.io?.emit('log_change', { type: 'reset' });

    res.json({
      success: true,
      message: 'تم تنظيف كافة البيانات التجريبية والوهمية من المتجر بنجاح! 🧹✨',
      deleted: {
        users: usersResult.deletedCount,
        orders: ordersResult.deletedCount,
        products: productsResult.deletedCount,
        messages: messagesResult.deletedCount
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
