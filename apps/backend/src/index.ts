import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/error-handler';
import { validateStoreContext } from './middleware/store-context';

// Import routes
import storeRoutes from './routes/store.routes';
import billboardRoutes from './routes/billboard.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import pageRoutes from './routes/page.routes';
import newsletterRoutes from './routes/newsletter.routes';
import variantRoutes from './routes/variant.routes';
import transactionRoutes from './routes/transaction.routes';
import paymentRoutes from './routes/payment.routes';
import customerRoutes from './routes/customer.routes';
import { apiRateLimit } from './middleware/rate-limit';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production') {
  const requiredEnvironment = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'ALLOWED_ORIGINS',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'SMTP_USER',
    'SMTP_PASS',
    'PUBLIC_STOREFRONT_URL',
  ];
  const missing = requiredEnvironment.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',').filter(Boolean);
const isLocalDevOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buffer) => {
    if (req.url === '/api/v1/payment/webhook') {
      (req as express.Request & { rawBody?: string }).rawBody = buffer.toString('utf8');
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api/v1', apiRateLimit);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'E-commerce API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      stores: '/api/v1/stores',
      billboards: '/api/v1/stores/:storeId/billboards',
      categories: '/api/v1/stores/:storeId/categories',
      products: '/api/v1/stores/:storeId/products',
      pages: '/api/v1/stores/:storeId/pages',
      orders: '/api/v1/orders',
      users: '/api/v1/users',
      upload: '/api/v1/media'
    }
  });
});

app.get('/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ok' : 'degraded',
    database: databaseReady ? 'connected' : 'unavailable',
  });
});

// Store Management API
app.use('/api/v1/stores', storeRoutes);

// Store-scoped APIs with context validation
app.use('/api/v1/stores/:storeId/billboards', validateStoreContext, billboardRoutes);
app.use('/api/v1/stores/:storeId/categories', validateStoreContext, categoryRoutes);
app.use('/api/v1/stores/:storeId/products', validateStoreContext, productRoutes);
app.use('/api/v1/stores/:storeId/pages', validateStoreContext, pageRoutes);
app.use('/api/v1/stores/:storeId/newsletter', validateStoreContext, newsletterRoutes);
app.use('/api/v1/stores/:storeId/customers', validateStoreContext, customerRoutes);

// Other routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/media', uploadRoutes);

// Variant routes (public and admin)
app.use('/api/v1', variantRoutes);

// Transaction routes (admin)
app.use('/api/v1/transactions', transactionRoutes);

// Payment routes
app.use('/api/v1/payment', paymentRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling
app.use(errorHandler);

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received; draining HTTP requests.`);
    const forceExit = setTimeout(() => process.exit(1), 9_000);
    forceExit.unref();

    server.close(async (error) => {
      try {
        await mongoose.disconnect();
      } finally {
        clearTimeout(forceExit);
        process.exit(error ? 1 : 0);
      }
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Backend startup failed:', error);
  process.exit(1);
});

export default app;
