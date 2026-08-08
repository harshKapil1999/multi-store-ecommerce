import { Router } from 'express';
import { getStoreCustomerByEmail, getStoreCustomers } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';
import { requireStoreAccess } from '../middleware/store-context';

const router: Router = Router({ mergeParams: true });

router.use(authenticate, authorize('admin', 'store_owner'), requireStoreAccess);
router.get('/', getStoreCustomers);
router.get('/:customerEmail', getStoreCustomerByEmail);

export default router;
