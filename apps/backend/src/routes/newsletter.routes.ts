import { Router } from 'express';
import { authorize, authenticate } from '../middleware/auth';
import { requireStoreAccess } from '../middleware/store-context';
import * as newsletterController from '../controllers/newsletter.controller';

const router: Router = Router({ mergeParams: true });

router.post('/', newsletterController.subscribe);
router.get('/', authenticate, authorize('admin', 'store_owner'), requireStoreAccess, newsletterController.listSubscribers);

export default router;
