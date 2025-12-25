import { Router } from 'express';
import * as variantController from '../controllers/variant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/products/:productId/variants', variantController.getVariantsByProduct);
router.get('/variants/:id', variantController.getVariantById);

// Admin routes
router.use(authenticate);
router.use(authorize('admin', 'store_owner'));

router.post('/products/:productId/variants', variantController.createVariant);
router.post('/products/:productId/variants/bulk', variantController.bulkCreateVariants);
router.put('/variants/:id', variantController.updateVariant);
router.patch('/variants/:id/stock', variantController.updateVariantStock);
router.delete('/variants/:id', variantController.deleteVariant);

export default router;
