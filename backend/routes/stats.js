const router = require('express').Router();
const Product = require('../models/Product');
const Order   = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const { protect, adminOnly } = require('../middleware/auth');

// @desc  Public storefront stats: delivered orders, avg rating, product count
// @route GET /api/stats/public
// @access Public
router.get('/public', async (req, res) => {
  try {
    const [
      totalProducts,
      deliveredCount,
      ratingAgg
    ] = await Promise.all([
      Product.countDocuments({}),
      Order.countDocuments({ status: { $in: ['Delivered', 'Paid', 'Shipped'] } }),
      Product.aggregate([
        { $match: { reviewsCount: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    const avgRating = ratingAgg.length > 0
      ? Math.round(ratingAgg[0].avgRating * 10) / 10
      : 0;

    res.json({
      success: true,
      stats: {
        totalProducts,
        deliveredOrders: deliveredCount,
        avgRating
      }
    });
  } catch (err) {
    res.json({
      success: true,
      stats: { totalProducts: 0, deliveredOrders: 0, avgRating: 0 }
    });
  }
});

// @desc  Admin comprehensive dashboard stats (all metrics in one call)
// @route GET /api/stats/admin
// @access Private/Admin
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const User    = require('../models/User');
    const Message = require('../models/Message');

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalMessages,
      unreadMessages,
      revenueAgg,
      todayVisits,
      monthVisits,
      recentOrders,
      recentMessages
    ] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({ role: 'customer' }),
      Message.countDocuments({}),
      Message.countDocuments({ isRead: false }),
      Order.aggregate([
        { $match: { status: { $in: ['Paid', 'Delivered', 'Shipped'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      ActivityLog.countDocuments({ action: 'زيارة جديدة', createdAt: { $gte: todayStart } }),
      ActivityLog.countDocuments({ action: 'زيارة جديدة', createdAt: { $gte: monthStart } }),
      Order.find().sort({ createdAt: -1 }).limit(5).select('orderId shippingInfo total status createdAt'),
      Message.find().sort({ createdAt: -1 }).limit(5).select('name email subject isRead createdAt')
    ]);

    // Collect recent reviews from products
    const productsWithReviews = await Product.find({ 'reviews.0': { $exists: true } }).select('name reviews').limit(20);
    let recentReviews = [];
    productsWithReviews.forEach(p => {
      p.reviews.forEach(r => {
        recentReviews.push({ id: r._id, productId: p._id, productName: p.name, author: r.name, rating: r.rating, text: r.comment, status: r.status || 'pending', createdAt: r.createdAt });
      });
    });
    recentReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentReviews = recentReviews.slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalRevenue: revenueAgg[0]?.total || 0,
        totalOrders,
        totalProducts,
        totalUsers,
        totalMessages,
        unreadMessages,
        todayVisits,
        monthVisits,
        recentOrders,
        recentReviews,
        recentMessages
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.json({ success: true, stats: { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, totalMessages: 0, unreadMessages: 0, todayVisits: 0, monthVisits: 0, recentOrders: [], recentReviews: [], recentMessages: [] } });
  }
});

// @desc  Admin weekly sales chart data (last 4 weeks)
// @route GET /api/stats/weekly-sales
// @access Private/Admin
router.get('/weekly-sales', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const weeks = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const result = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: weekStart, $lte: weekEnd },
            status: { $in: ['Paid', 'Delivered', 'Shipped'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        }
      ]);

      weeks.push({
        label: i === 0 ? 'الحالي' : `الأسبوع ${4 - i}`,
        revenue: result.length > 0 ? result[0].totalRevenue : 0,
        orders: result.length > 0 ? result[0].orderCount : 0,
        isCurrent: i === 0
      });
    }

    res.json({ success: true, weeks });
  } catch (err) {
    res.json({
      success: true,
      weeks: [
        { label: 'الأسبوع 1', revenue: 0, orders: 0, isCurrent: false },
        { label: 'الأسبوع 2', revenue: 0, orders: 0, isCurrent: false },
        { label: 'الأسبوع 3', revenue: 0, orders: 0, isCurrent: false },
        { label: 'الحالي',    revenue: 0, orders: 0, isCurrent: true  }
      ]
    });
  }
});

module.exports = router;
