import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middleware/error-handler';
import { NewsletterSubscriber } from '../models/newsletter-subscriber.model';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new AppError('Enter a valid email address', 400);
    if (req.body.consent !== true) throw new AppError('Consent is required to subscribe', 400);

    await NewsletterSubscriber.findOneAndUpdate(
      { storeId: req.params.storeId, email },
      { $set: { status: 'subscribed', consentAt: new Date(), source: 'storefront_home' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, message: 'You are subscribed.' });
  } catch (error) {
    next(error);
  }
};

export const listSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const query = { storeId: req.params.storeId };
    const [data, total] = await Promise.all([
      NewsletterSubscriber.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      NewsletterSubscriber.countDocuments(query),
    ]);
    res.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};
