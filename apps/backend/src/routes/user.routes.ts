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
    body('email').isEmail().trim().toLowerCase(),
    body('password').isString().isLength({ min: 12, max: 128 }),
    body('otp').isString().matches(/^\d{6}$/),
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
  ],
  authRateLimit,
  userController.register
);

router.post(
  '/login',
  [body('email').isEmail().trim().toLowerCase(), body('password').notEmpty()],
  authRateLimit,
  userController.login
);

router.post('/send-otp', authRateLimit, [body('email').isString().trim().isEmail().isLength({ max: 254 }).toLowerCase()], userController.sendOtp);
router.post('/verify-otp', authRateLimit, [body('email').isString().trim().isEmail().isLength({ max: 254 }).toLowerCase(), body('otp').isString().matches(/^\d{6}$/), body('name').optional().isString().trim().isLength({ min: 1, max: 120 })], userController.verifyOtp);

// Protected routes
router.get('/me', authenticate, userController.getCurrentUser);

router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim(),
    body('email').optional().isEmail().trim().toLowerCase(),
  ],
  userController.updateProfile
);

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isString().isLength({ min: 12, max: 128 }),
  ],
  userController.changePassword
);

const addressValidation = [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('address1').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('country').notEmpty().trim(),
  body('postalCode').notEmpty().trim(),
  body('phone').optional().trim(),
];

router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, addressValidation, userController.addAddress);
router.put('/addresses/:addressId', authenticate, addressValidation, userController.updateAddress);
router.delete('/addresses/:addressId', authenticate, userController.deleteAddress);

export default router;
