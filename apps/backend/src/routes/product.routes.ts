import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  listProductsQuerySchema,
} from '../validators/billboard-category-product.schema';
import { requireStoreAccess } from '../middleware/store-context';

const router: Router = Router({ mergeParams: true });

// Public routes
router.get('/', validate(listProductsQuerySchema, 'query'), productController.listProducts);
router.get('/search/suggestions', productController.getSearchSuggestions);
router.get('/featured', productController.getFeaturedProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

// Protected routes (admin/store_owner only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  validate(updateProductSchema),
  productController.updateProduct
);

router.patch(
  '/:id/stock',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  validate(updateStockSchema),
  productController.updateStock
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  productController.deleteProduct
);

export default router;
