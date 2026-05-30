const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'store_settings'
  },
  slides: [
    {
      title: String,
      subtitle: String,
      img: String,
      link: String
    }
  ],
  faqs: [
    {
      q: String,
      a: String,
      category: String
    }
  ],
  footer: {
    about: String,
    address: String,
    phone: String,
    email: String,
    workingHours: String,
    socialLinks: {
      facebook: String,
      instagram: String,
      whatsapp: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingSchema);
