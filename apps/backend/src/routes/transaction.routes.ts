import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes protected
router.use(authenticate);

router.get('/', authorize('admin'), transactionController.getAllTransactions);
router.get('/store/:storeId', authorize('admin', 'store_owner'), transactionController.getTransactionsByStore);
router.get('/order/:orderId', transactionController.getTransactionByOrderId);
router.get('/:id', transactionController.getTransactionById);

export default router;
