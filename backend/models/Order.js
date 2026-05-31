const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Shipping info
  shippingInfo: {
    name:        { type: String, required: true },
    email:       { type: String, default: '' },
    phone:       { type: String, required: true },
    address:     { type: String, required: true },
    governorate: { type: String, default: '' },
    city:        { type: String, default: '' },
    postalCode:  { type: String, default: '' }
  },
  // Cart items snapshot
  cartItems: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:     String,
    nameEn:   String,
    image:    String,
    price:    Number,
    quantity: Number,
    subtotal: Number
  }],
  // Pricing
  subtotal:        { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount:  { type: Number, default: 0 },
  shippingCost:    { type: Number, default: 0 },
  total:           { type: Number, required: true },
  couponCode:      { type: String, default: '' },

  // Payment
  paymentMethod:  { type: String, enum: ['Vodafone Cash', 'InstaPay'], required: true },
  paymentDetail:  { type: String, default: '' },
  paymentProof:   { type: String, default: '' }, // uploaded screenshot path
  
  // Status flow
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  statusHistory: [{
    status:    String,
    note:      String,
    updatedAt: { type: Date, default: Date.now }
  }],

  // PDF Invoice
  invoicePdf: { type: String, default: '' },
  
  notes: { type: String, default: '' }
}, { timestamps: true });

// Auto-generate orderId
OrderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const ts = Date.now().toString(36).toUpperCase();
    this.orderId = `FTK-${ts}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
