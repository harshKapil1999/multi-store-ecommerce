import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.post('/', optionalAuthenticate, orderController.createOrder); // Guest checkout supported
router.get('/track/:id', orderController.trackOrder);

// Protected routes
router.use(authenticate);

router.get('/', orderController.getAllOrders);
router.get('/store/:storeId', authorize('admin', 'store_owner'), orderController.getOrdersByStore);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', authorize('admin', 'store_owner'), orderController.updateOrderStatus);

export default router;
