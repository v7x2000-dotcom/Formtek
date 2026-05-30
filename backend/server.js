const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dns = require('dns');
require('dotenv').config();

// Force Google DNS to resolve MongoDB Atlas SRV records (ISP DNS may block SRV queries)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);


const app = express();

// ─── Database State ────────────────────────────────────────────────────────────
global.dbConnected = true;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const allowed = [
    process.env.FRONTEND_URL,
    'https://v7x2000-dotcom.github.io',
    'https://formtek-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  let corsOptions;
  if (origin === 'null' || !origin || origin.startsWith('file://')) {
    // For local file:// protocol, allow CORS but disable credentials (cookies) to satisfy strict W3C CORS specs
    corsOptions = {
      origin: origin || '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  } else if (allowed.includes(origin)) {
    corsOptions = {
      origin: origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  } else {
    corsOptions = { origin: false }; // CORS Blocked
  }
  callback(null, corsOptions);
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Static Files (Uploads) ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Serve Frontend Static Files ──────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/upload',   require('./routes/upload'));
app.use('/api/logs',     require('./routes/logs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/stats',    require('./routes/stats'));
app.use('/api/messages', require('./routes/messages'));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Formtek API is running ✅',
    env: process.env.NODE_ENV,
    db: global.dbConnected ? 'connected ✅' : 'fallback mode ⚡',
    time: new Date().toISOString()
  });
});

// ─── SPA Fallback: Serve index.html for all non-API routes ───────────────────
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  const status = err.statusCode || 500;
  
  // Log API / Database errors to database using logActivity
  const logActivity = require('./utils/logger');
  logActivity(
    'خطأ في النظام / API',
    `حدث خطأ في النظام: ${err.message || err}`,
    'danger',
    req.user || null,
    req.ip
  ).catch(logErr => console.error('Failed to log error activity:', logErr.message));

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Start Server FIRST, then connect to DB ───────────────────────────────────
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

global.io = io;

io.on('connection', (socket) => {
  console.log(`📡 WebSocket connected: ${socket.id}`);
  
  // Broadcast active visitors count to all connected clients
  io.emit('visitors_count', io.engine.clientsCount);

  socket.on('disconnect', () => {
    console.log(`📡 WebSocket disconnected: ${socket.id}`);
    io.emit('visitors_count', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Formtek Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`🌐 Storefront  : http://localhost:${PORT}`);
  console.log(`📡 API         : http://localhost:${PORT}/api`);
  console.log(`⚡ Admin login : ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  console.log(`📡 Attempting MongoDB connection in background...`);
});

// ─── Async MongoDB Connection (non-blocking) ───────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    global.dbConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🔄 Full database mode activated!`);

    // Auto-seed admin if DB just connected and has no users
    try {
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('🌱 Empty database detected - auto-seeding admin account...');
        await User.create({
          name: 'Ayman Ahmed',
          email: process.env.ADMIN_EMAIL || 'support@formtek.com',
          password: process.env.ADMIN_PASSWORD || 'Formtek@2026',
          phone: '01020988478',
          role: 'admin',
          isActive: true
        });
        console.log(`✅ Admin auto-seeded: ${process.env.ADMIN_EMAIL}`);
      }
    } catch (seedErr) {
      console.error('⚠️  Auto-seed warning:', seedErr.message);
    }
  } catch (error) {
    global.dbConnected = false;
    console.error(`❌ CRITICAL: MongoDB connection failed! Server cannot run without database: ${error.message}`);
    process.exit(1);
  }
};

connectDB();
