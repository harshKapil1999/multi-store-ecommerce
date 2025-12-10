import { Router } from 'express';
import * as billboardController from '../controllers/billboard.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createBillboardSchema,
  updateBillboardSchema,
  reorderBillboardsSchema,
} from '../validators/billboard-category-product.schema';

const router = Router({ mergeParams: true });

// Public routes
router.get('/', billboardController.listBillboards);
router.get('/:id', billboardController.getBillboardById);

// Protected routes (admin/store_owner only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'store_owner'),
  validate(createBillboardSchema),
  billboardController.createBillboard
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  validate(updateBillboardSchema),
  billboardController.updateBillboard
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'store_owner'),
  billboardController.deleteBillboard
);

router.patch(
  '/order/update',
  authenticate,
  authorize('admin', 'store_owner'),
  validate(reorderBillboardsSchema),
  billboardController.reorderBillboards
);

export default router;
