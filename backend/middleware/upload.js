const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Cloudinary Setup ──────────────────────────────────────────────────────────
let cloudinaryConfigured = false;
let cloudinary, CloudinaryStorage;

try {
  cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage: CS } = require('multer-storage-cloudinary');
  CloudinaryStorage = CS;

  if (process.env.CLOUDINARY_URL) {
    cloudinaryConfigured = true;
    console.log('☁️  Cloudinary configured via CLOUDINARY_URL — images will be stored in the cloud.');
  } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
    console.log('☁️  Cloudinary configured via credentials — images will be stored in the cloud.');
  } else {
    console.warn('⚠️  Cloudinary env vars missing — falling back to local disk storage.');
  }
} catch (e) {
  console.warn('⚠️  Cloudinary packages not installed — falling back to local disk storage.');
}

// ─── Local Disk Fallback ───────────────────────────────────────────────────────
const createLocalStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  }
});

// ─── Cloudinary Storage Factories ─────────────────────────────────────────────
const createCloudinaryStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `formtek/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif', 'jfif', 'bmp', 'tiff', 'svg'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

// ─── Image Format Filter ───────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.avif', '.heic', '.heif', '.bmp', '.tiff', '.tif', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  // Also allow by MIME type for files without extension
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/svg+xml'];
  if (allowed.includes(ext) || allowedMime.includes(file.mimetype)) return cb(null, true);
  cb(new Error('يُسمح فقط بملفات الصور (jpg, png, webp, heic, gif, bmp, tiff)'), false);
};

// ─── Pick storage based on configuration ──────────────────────────────────────
const getStorage = (folder) => cloudinaryConfigured
  ? createCloudinaryStorage(folder)
  : createLocalStorage(folder);

// ─── Upload URL helper (Cloudinary returns full URL, local returns relative path) ─
const getFileUrl = (file, folder) => {
  if (cloudinaryConfigured) {
    return file.path; // Cloudinary returns the full secure HTTPS URL in file.path
  }
  return `/uploads/${folder}/${file.filename}`;
};

// ─── Exportable multer instances ──────────────────────────────────────────────
exports.uploadProductImages = multer({
  storage: getStorage('products'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 6);

exports.uploadAvatar = multer({
  storage: getStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('avatar');

exports.uploadPaymentProof = multer({
  storage: getStorage('payment-proofs'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('proof');

exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `خطأ في رفع الملف: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Export helper for routes to get proper URL
exports.getFileUrl = getFileUrl;
exports.isCloudinary = () => cloudinaryConfigured;
