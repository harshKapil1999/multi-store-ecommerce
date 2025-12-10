import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
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

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Log JWT_SECRET on startup (first 20 chars for security)
console.log('🔐 JWT_SECRET loaded:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) + '...' : 'NOT SET (using default)');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.ADMIN_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

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
  res.json({ status: 'ok', message: 'Server is running' });
});

// Store Management API
app.use('/api/v1/stores', storeRoutes);

// Store-scoped APIs with context validation
app.use('/api/v1/stores/:storeId/billboards', validateStoreContext, billboardRoutes);
app.use('/api/v1/stores/:storeId/categories', validateStoreContext, categoryRoutes);
app.use('/api/v1/stores/:storeId/products', validateStoreContext, productRoutes);
app.use('/api/v1/stores/:storeId/pages', validateStoreContext, pageRoutes);

// Other routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/media', uploadRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
