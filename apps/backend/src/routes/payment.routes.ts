import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { paymentRateLimit } from '../middleware/rate-limit';

const router: Router = Router();

// Create Razorpay order (public for guest checkout)
router.post('/create-order', paymentRateLimit, paymentController.createRazorpayOrder);

// Verify payment (public for guest checkout)
router.post('/verify', paymentRateLimit, paymentController.verifyPayment);

// Webhook (no auth required, validated by signature)
router.post('/webhook', paymentController.handleWebhook);

// Refund (admin only)
router.post('/refund', authenticate, authorize('admin', 'store_owner'), paymentController.refundPayment);

export default router;
