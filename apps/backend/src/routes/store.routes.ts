import { Router } from 'express';
import * as storeController from '../controllers/store.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStoreSchema, updateStoreSchema, toggleStoreSchema, listStoresQuerySchema } from '../validators/store.schema';

const router = Router();

// Public routes
router.get('/', validate(listStoresQuerySchema, 'query'), storeController.getAllStores);
router.get('/slug/:slug', storeController.getStoreBySlug);
router.get('/:id', storeController.getStoreById);

// Protected routes (admin/store_owner only)
router.post('/', authenticate, authorize('admin', 'store_owner'), validate(createStoreSchema), storeController.createStore);

router.put('/:id', authenticate, authorize('admin', 'store_owner'), validate(updateStoreSchema), storeController.updateStore);

router.delete('/:id', authenticate, authorize('admin', 'store_owner'), storeController.deleteStore);

router.patch('/:id/toggle', authenticate, authorize('admin', 'store_owner'), validate(toggleStoreSchema), storeController.toggleStoreActive);

export default router;
