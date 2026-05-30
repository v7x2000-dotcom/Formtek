const router = require('express').Router();
const Message = require('../models/Message');
const { protect, adminOnly } = require('../middleware/auth');
const logActivity = require('../utils/logger');

// Submit a new message (Public)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'يرجى ملء الحقول المطلوبة (الاسم، البريد الإلكتروني، الرسالة)' });
    }

    const msg = await Message.create({ name: name.trim(), email: email.trim(), phone: phone || '', subject: subject || 'استفسار عام', message: message.trim() });

    // Real-time broadcast to admin
    global.io?.emit('new_message', { id: msg._id, name: msg.name, subject: msg.subject, createdAt: msg.createdAt });

    // Activity log
    await logActivity('رسالة تواصل جديدة', `تلقى الموقع رسالة جديدة من "${msg.name}" (${msg.email}): ${msg.subject}`, 'info', null, req.ip);

    res.status(201).json({ success: true, message: 'تم إرسال رسالتك بنجاح! سيتم التواصل معك قريباً. 📨' });
  } catch (err) {
    next(err);
  }
});

// Get all messages (Admin only)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

// Mark as read (Admin only)
router.put('/:id/read', protect, adminOnly, async (req, res, next) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Delete message (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'تم حذف الرسالة بنجاح ✅' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
