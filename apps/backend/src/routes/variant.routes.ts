import { Router } from 'express';
import * as variantController from '../controllers/variant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.get('/products/:productId/variants', variantController.getVariantsByProduct);
router.get('/variants/:id', variantController.getVariantById);

// Admin routes
router.post('/products/:productId/variants', authenticate, authorize('admin', 'store_owner'), variantController.createVariant);
router.post('/products/:productId/variants/bulk', authenticate, authorize('admin', 'store_owner'), variantController.bulkCreateVariants);
router.put('/variants/:id', authenticate, authorize('admin', 'store_owner'), variantController.updateVariant);
router.patch('/variants/:id/stock', authenticate, authorize('admin', 'store_owner'), variantController.updateVariantStock);
router.delete('/variants/:id', authenticate, authorize('admin', 'store_owner'), variantController.deleteVariant);

export default router;
