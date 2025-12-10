import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes protected
router.use(authenticate);

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/store/:storeId', authorize('admin', 'store_owner'), orderController.getOrdersByStore);
router.post('/', orderController.createOrder);
router.put('/:id/status', authorize('admin', 'store_owner'), orderController.updateOrderStatus);

export default router;
