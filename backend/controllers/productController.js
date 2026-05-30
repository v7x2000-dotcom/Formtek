const mongoose    = require('mongoose');
const Product     = require('../models/Product');
const logActivity = require('../utils/logger');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, goal, minPrice, maxPrice, sort, page = 1, limit = 20, featured, sale } = req.query;

    const filter = {};
    if (search) filter.$or = [
      { name:   { $regex: search, $options: 'i' } },
      { nameEn: { $regex: search, $options: 'i' } },
      { brand:  { $regex: search, $options: 'i' } }
    ];
    if (category && category !== 'all') filter.category = category;
    if (goal     && goal     !== 'all') filter.goal     = goal;
    if (minPrice || maxPrice) filter.price = {
      ...(minPrice && { $gte: Number(minPrice) }),
      ...(maxPrice && { $lte: Number(maxPrice) }),
    };
    if (featured === 'true') filter.isFeatured = true;
    if (sale     === 'true') filter.isOnSale   = true;

    const sortOptions = {
      'price-asc':  { price: 1 },
      'price-desc': { price: -1 },
      'rating':     { rating: -1 },
      'newest':     { createdAt: -1 },
      'default':    { isFeatured: -1, createdAt: -1 }
    };
    const sortQuery = sortOptions[sort] || sortOptions['default'];
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
  } catch (err) { next(err); }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = mongoose.Types.ObjectId.isValid(id)
      ? await Product.findById(id)
      : await Product.findOne({ slug: id });

    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    global.io?.emit('product_change', { type: 'create', product });
    await logActivity('إضافة منتج', `تمت إضافة منتج جديد: "${product.name}" بسعر ${product.price} EGP`, 'success', req.user, req.ip);
    res.status(201).json({ success: true, message: 'تم إضافة المنتج بنجاح ✅', product });
  } catch (err) { next(err); }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    global.io?.emit('product_change', { type: 'update', product });
    await logActivity('تعديل منتج', `تم تعديل المنتج: "${product.name}"`, 'info', req.user, req.ip);
    res.json({ success: true, message: 'تم تحديث المنتج بنجاح ✅', product });
  } catch (err) { next(err); }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    global.io?.emit('product_change', { type: 'delete', id: req.params.id });
    await logActivity('حذف منتج', `تم حذف المنتج: "${product.name}"`, 'warning', req.user, req.ip);
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (err) { next(err); }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال تقييم صحيح (1-5)' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    const alreadyReviewed = product.reviews?.find(r => r.user?.toString() === req.user.id);
    if (alreadyReviewed) return res.status(400).json({ success: false, message: 'لقد قمت بتقييم هذا المنتج مسبقاً' });

    if (!product.reviews) product.reviews = [];
    product.reviews.push({ user: req.user.id, name: req.user.name, rating: Number(rating), comment });
    product.reviewsCount = product.reviews.length;
    product.rating       = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
    await product.save();

    global.io?.emit('product_change', { type: 'review', productId: product._id, rating: product.rating, reviewsCount: product.reviewsCount });
    await logActivity('إضافة تقييم', `قيم "${req.user.name}" المنتج "${product.name}" بـ ${rating} نجوم`, 'info', req.user, req.ip);
    res.status(201).json({ success: true, message: 'تم إضافة تقييمك بنجاح ⭐' });
  } catch (err) { next(err); }
};

// @desc    Delete review (Admin only)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });

    const reviewIndex = product.reviews.findIndex(r => r._id.toString() === req.params.reviewId);
    if (reviewIndex === -1) return res.status(404).json({ success: false, message: 'التعليق غير موجود' });

    const deletedReview = product.reviews[reviewIndex];
    product.reviews.splice(reviewIndex, 1);
    product.reviewsCount = product.reviews.length;
    product.rating       = product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length : 5.0;
    await product.save();

    global.io?.emit('product_change', { type: 'review', productId: product._id, rating: product.rating, reviewsCount: product.reviewsCount });
    await logActivity('حذف تعليق', `تم حذف تعليق "${deletedReview.name}" من المنتج: "${product.name}"`, 'danger', req.user, req.ip);
    res.json({ success: true, message: 'تم حذف التعليق بنجاح ✅' });
  } catch (err) { next(err); }
};

// @desc    Get all reviews across all products (Admin only)
// @route   GET /api/products/reviews/all
// @access  Private/Admin
exports.getAllReviews = async (req, res, next) => {
  try {
    const products = await Product.find({ 'reviews.0': { $exists: true } });
    let allReviews = [];
    products.forEach(p => {
      (p.reviews || []).forEach(r => {
        allReviews.push({
          id: r._id, productId: p._id, productName: p.name,
          author: r.name, rating: r.rating, text: r.comment,
          status: r.status || 'pending', createdAt: r.createdAt
        });
      });
    });
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, reviews: allReviews });
  } catch (err) { next(err); }
};

// @desc    Update review status — Admin only
// @route   PUT /api/products/:id/reviews/:reviewId/status
// @access  Private/Admin
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة التقييم غير صحيحة' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'التعليق غير موجود' });

    review.status = status;
    await product.save();
    global.io?.emit('product_change', { type: 'review_status', productId: product._id });
    await logActivity(
      status === 'approved' ? 'الموافقة على تقييم' : 'رفض تقييم',
      `${status === 'approved' ? 'تمت الموافقة' : 'تم رفض'} تقييم "${review.name}" على المنتج "${product.name}"`,
      status === 'approved' ? 'success' : 'warning',
      req.user, req.ip
    );
    res.json({ success: true, message: status === 'approved' ? 'تمت الموافقة على التقييم ✅' : 'تم رفض التقييم 🚫' });
  } catch (err) { next(err); }
};
