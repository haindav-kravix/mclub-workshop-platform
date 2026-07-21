import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import workshopRoutes from './routes/workshops.js';
import registrationRoutes from './routes/registrations.js';
import attendanceRoutes from './routes/attendance.js';
import blogRoutes from './routes/blogs.js';
import achievementRoutes from './routes/achievements.js';
import certificateRoutes from './routes/certificates.js';
import entryRoutes from './routes/entry.js';
import { getAchievementImage } from './controllers/achievementController.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// File path setup for static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

const rateBuckets = new Map();
const rateLimit = ({ windowMs, max, message }) => (req, res, next) => {
  const key = `${req.ip}:${req.baseUrl || ''}:${req.path.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  res.setHeader('RateLimit-Limit', String(max));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  if (bucket.count > max) {
    return res.status(429).json({ message });
  }
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}, 15 * 60 * 1000).unref();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000',
  'https://mongodbtcklh.club',
  'https://www.mongodbtcklh.club',
  'https://client-lac-eight-57.vercel.app',
  'https://client-darenanigamer-6336s-projects.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
      /^http:\/\/192-168-1-7\.sslip\.io:3000$/.test(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS blocked'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/media/highlights/:id/:index', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 800,
  message: 'Too many media requests. Please try again shortly.'
}), getAchievementImage);

// API Routes
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 160,
  message: 'Too many login requests. Please try again later.'
}), authRoutes);
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1400,
  message: 'Too many requests. Please slow down.'
}));
app.use('/api/workshops', workshopRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/entry', entryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError' || err.message?.startsWith('Invalid file type')) {
    return res.status(400).json({
      message: err.message || 'Invalid uploaded file'
    });
  }
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
