import { Router } from 'express';
import * as billboardController from '../controllers/billboard.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { requireStoreAccess } from '../middleware/store-context';
import {
  createBillboardSchema,
  updateBillboardSchema,
  reorderBillboardsSchema,
} from '../validators/billboard-category-product.schema';

const router: Router = Router({ mergeParams: true });

// Public routes
router.get('/', billboardController.listBillboards);
router.patch(
  '/order/update',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  validate(reorderBillboardsSchema),
  billboardController.reorderBillboards
);
router.get('/:id', billboardController.getBillboardById);

// Protected routes (admin/store_owner only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  validate(createBillboardSchema),
  billboardController.createBillboard
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  validate(updateBillboardSchema),
  billboardController.updateBillboard
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  requireStoreAccess,
  billboardController.deleteBillboard
);

export default router;
