const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  nameEn: { type: String, trim: true, default: '' },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  brand: { type: String, required: true, trim: true },
  sku: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  ingredients: { type: String, default: '' },
  usage: { type: String, default: '' },
  warnings: { type: String, default: '' },
  
  category: {
    type: String,
    required: true,
    enum: ['protein', 'creatine', 'vitamins', 'fat-burners', 'mass-gainer', 'amino-acids', 'shakers', 'lifting-belts', 'accessories']
  },
  categoryAr: { type: String, default: '' },
  
  goal: { type: String, default: 'muscle' },
  goalAr: { type: String, default: '' },

  // Pricing
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: null },
  
  // Media
  image: { type: String, default: '' },
  images: [{ type: String }],  // Multiple product images

  // Physical specs
  weight: { type: String, default: '' },    // e.g. "2kg", "5lbs"
  size: { type: String, default: '' },      // e.g. "2000g"
  flavor: { type: String, default: '' },    // e.g. "Chocolate"
  expiryDate: { type: String, default: '' }, // e.g. "2026-12"

  // Nutritional specs (flexible key-value)
  specs: {
    type: Map,
    of: String,
    default: {}
  },

  // Inventory
  stock: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },

  // Ratings aggregate
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },

  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    media: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Auto-generate slug
ProductSchema.pre('save', function() {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.nameEn
      ? this.nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
      : this.name.replace(/\s+/g, '-').replace(/[^\w\u0621-\u064A-]+/g, '');
  }
  // Auto SKU
  if (!this.sku) {
    this.sku = `FTK-${Date.now().toString(36).toUpperCase()}`;
  }
  // isOnSale
  this.isOnSale = !!(this.oldPrice && this.oldPrice > this.price);
  // isAvailable
  this.isAvailable = this.stock > 0;
});

module.exports = mongoose.model('Product', ProductSchema);
