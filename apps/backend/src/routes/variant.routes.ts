import { validate } from '../middleware/validate';
import { variantSchema, updateVariantSchema, bulkVariantSchema } from '../validators/variant.schema';
import { Router } from 'express';
import * as variantController from '../controllers/variant.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.get('/products/:productId/variants', optionalAuthenticate, variantController.getVariantsByProduct);
router.get('/variants/:id', variantController.getVariantById);

// Admin routes
router.post('/products/:productId/variants', authenticate, authorize('admin', 'store_owner'), validate(variantSchema), variantController.createVariant);
router.post('/products/:productId/variants/bulk', authenticate, authorize('admin', 'store_owner'), validate(bulkVariantSchema), variantController.bulkCreateVariants);
router.put('/variants/:id', authenticate, authorize('admin', 'store_owner'), validate(updateVariantSchema), variantController.updateVariant);
router.patch('/variants/:id/stock', authenticate, authorize('admin', 'store_owner'), variantController.updateVariantStock);
router.delete('/variants/:id', authenticate, authorize('admin', 'store_owner'), variantController.deleteVariant);

export default router;
