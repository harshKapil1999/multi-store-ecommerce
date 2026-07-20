import { rateLimit } from 'express-rate-limit';

const common = {
  standardHeaders: true,
  legacyHeaders: false,
};

export const apiRateLimit = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: { success: false, message: 'Too many requests. Please try again shortly.' },
});

export const authRateLimit = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 12,
  message: { success: false, message: 'Too many authentication attempts. Please wait and try again.' },
});

export const paymentRateLimit = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: { success: false, message: 'Too many payment attempts. Please wait before retrying.' },
});
