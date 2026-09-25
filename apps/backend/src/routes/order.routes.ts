import * as shipping from '../controllers/shipping.controller';
import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.post('/', authenticate, orderController.createOrder); // Guest checkout supported
router.get('/track/:id', authenticate, orderController.trackOrder);

// Protected routes
router.use(authenticate);

router.get('/', orderController.getAllOrders);
router.get('/store/:storeId', authorize('admin', 'store_owner'), orderController.getOrdersByStore);
router.get('/:id/shipment', shipping.getShipment);
router.get('/:id/shipment/tracking', shipping.getTracking);
router.post('/:id/shipment/rates', authorize('admin', 'store_owner'), shipping.getRates);
router.post('/:id/shipment/reconcile', authorize('admin', 'store_owner'), shipping.reconcileShipment);
router.post('/:id/shipment', authorize('admin', 'store_owner'), shipping.createShipment);
router.post('/:id/shipment/:action', authorize('admin', 'store_owner'), shipping.shipmentAction);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', authorize('admin', 'store_owner'), orderController.updateOrderStatus);

export default router;
