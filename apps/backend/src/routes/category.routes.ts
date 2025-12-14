import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/billboard-category-product.schema';

const router = Router({ mergeParams: true });

// Public routes
router.get('/', categoryController.listCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);

// Protected routes (admin/store_owner only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'store_owner'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  categoryController.deleteCategory
);

export default router;
