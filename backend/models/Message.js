const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true },
  phone:   { type: String, default: '', trim: true },
  subject: { type: String, default: 'استفسار عام', trim: true },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
