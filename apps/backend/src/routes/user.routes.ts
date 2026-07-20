import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimit } from '../middleware/rate-limit';

const router: Router = Router();

// Public routes
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
  ],
  authRateLimit,
  userController.register
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  authRateLimit,
  userController.login
);

router.post('/send-otp', authRateLimit, userController.sendOtp);
router.post('/verify-otp', authRateLimit, userController.verifyOtp);

// Protected routes
router.get('/me', authenticate, userController.getCurrentUser);

router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  userController.updateProfile
);

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  userController.changePassword
);

export default router;
