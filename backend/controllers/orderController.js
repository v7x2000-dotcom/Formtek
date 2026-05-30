const path        = require('path');
const fs          = require('fs');
const logActivity = require('../utils/logger');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingInfo, cartItems, paymentMethod, paymentDetail, subtotal, discountPercent, discountAmount, total, couponCode } = req.body;

    if (!shippingInfo || !cartItems?.length || !paymentMethod || !total) {
      return res.status(400).json({ success: false, message: 'بيانات الطلب غير مكتملة' });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح. يجب تسجيل الدخول لإتمام الطلب.' });
    }

    const Order   = require('../models/Order');
    const Product = require('../models/Product');

    for (const item of cartItems) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod && prod.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `المخزون غير كافٍ للمنتج: ${item.name}` });
        }
      }
    }

    const order = await Order.create({
      user: req.user.id, shippingInfo, cartItems,
      paymentMethod, paymentDetail: paymentDetail || '',
      paymentProof: req.body.paymentProof || '',
      subtotal, discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0, shippingCost: 0,
      total, couponCode: couponCode || '',
      statusHistory: [{ status: 'Pending', note: 'تم استلام الطلب بنجاح' }]
    });

    for (const item of cartItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    generateInvoicePDF(order).catch(err => console.error('PDF generation error:', err));
    global.io?.emit('order_change', { type: 'create', order });
    await logActivity('إنشاء طلب جديد', `قام العميل "${req.user.name}" بطلب رقم ${order.orderId} بقيمة ${order.total} EGP`, 'success', req.user, req.ip);

    res.status(201).json({ success: true, message: 'تم تسجيل طلبك بنجاح! سيتم التواصل معك قريباً. ✅', order });
  } catch (err) { next(err); }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const { status, page = 1, limit = 30 } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('user', 'name email'),
      Order.countDocuments(filter)
    ]);
    res.json({ success: true, total, orders });
  } catch (err) { next(err); }
};

// @desc    Get my orders
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findOne({ orderId: req.params.id }).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة الطلب غير صالحة' });
    }

    const Order = require('../models/Order');
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const oldStatus = order.status;
    order.status = status;
    order.statusHistory.push({ status, note: note || `تم تحديث الحالة إلى ${status}` });
    await order.save();
    global.io?.emit('order_change', { type: 'status_update', orderId: order.orderId, status, order });
    await logActivity('تحديث حالة الطلب', `تم تحديث حالة الطلب رقم ${order.orderId} من "${oldStatus}" إلى "${status}"`, 'info', req.user, req.ip);
    res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح ✅', order });
  } catch (err) { next(err); }
};

// @desc    Get admin dashboard stats
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const Order   = require('../models/Order');
    const Product = require('../models/Product');
    const [totalOrders, pendingOrders, paidOrders, totalRevenue, todayOrders, totalProducts] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: { $in: ['Paid', 'Shipped', 'Delivered'] } }),
      Order.aggregate([{ $match: { status: { $in: ['Paid', 'Shipped', 'Delivered'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Product.countDocuments()
    ]);
    res.json({ success: true, stats: { totalOrders, pendingOrders, paidOrders, totalRevenue: totalRevenue[0]?.total || 0, todayOrders, totalProducts } });
  } catch (err) { next(err); }
};

// PDF Invoice Generator (async, non-blocking)
async function generateInvoicePDF(order) {
  try {
    let PDFDocument;
    try { PDFDocument = require('pdfkit'); } catch { return; }
    const invoicesDir = path.join(__dirname, '..', 'uploads', 'invoices');
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
    const filename = `invoice-${order.orderId}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
      doc.fontSize(24).fillColor('#00ff66').text('FORMTEK', 50, 50);
      doc.fontSize(10).fillColor('#666').text('Sports Supplements Store', 50, 80);
      doc.fontSize(12).fillColor('#000').text(`فاتورة رقم: ${order.orderId}`, 400, 50, { align: 'right' });
      doc.text(`التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}`, 400, 70, { align: 'right' });
      doc.moveTo(50, 110).lineTo(550, 110).stroke('#e0e0e0');
      doc.fontSize(10).fillColor('#555');
      doc.text(`الاسم: ${order.shippingInfo?.name || ''}`, 50, 130);
      doc.text(`الهاتف: ${order.shippingInfo?.phone || ''}`, 50, 147);
      doc.text(`العنوان: ${order.shippingInfo?.address || ''}`, 50, 164);
      doc.text(`طريقة الدفع: ${order.paymentMethod}`, 350, 130, { align: 'right' });
      doc.moveTo(50, 190).lineTo(550, 190).stroke('#e0e0e0');
      let y = 210;
      order.cartItems?.forEach((item, i) => {
        const bg = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
        doc.rect(50, y - 4, 500, 22).fill(bg).fillColor('#333');
        doc.text(item.name, 60, y, { width: 270 });
        doc.text(String(item.quantity), 340, y, { width: 60, align: 'center' });
        doc.text(`${item.price} EGP`, 400, y, { width: 70, align: 'center' });
        doc.text(`${item.subtotal || item.price * item.quantity} EGP`, 470, y, { width: 80, align: 'right' });
        y += 24;
      });
      doc.moveTo(50, y + 8).lineTo(550, y + 8).stroke('#e0e0e0');
      y += 18;
      doc.fontSize(10).fillColor('#555').text(`الإجمالي: ${order.total} EGP`, 400, y, { width: 150, align: 'right' });
      doc.fontSize(9).fillColor('#aaa').text('شكراً لثقتك في فورمتك — FOCUS • DISCIPLINE • STRENGTH • RESULTS', 50, 750, { align: 'center', width: 500 });
      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  } catch (err) { console.error('generateInvoicePDF error:', err.message); }
}
