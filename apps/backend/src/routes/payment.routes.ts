import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Create Razorpay order (authenticated users)
router.post('/create-order', authenticate, paymentController.createRazorpayOrder);

// Verify payment
router.post('/verify', authenticate, paymentController.verifyPayment);

// Webhook (no auth required, validated by signature)
router.post('/webhook', paymentController.handleWebhook);

// Refund (admin only)
router.post('/refund', authenticate, authorize('admin', 'store_owner'), paymentController.refundPayment);

export default router;
