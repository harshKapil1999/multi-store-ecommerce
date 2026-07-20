import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { Store } from '../models/store.model';
import { AppError } from './error-handler';
import type { AuthRequest } from './auth';

export interface StoreContextRequest extends Request {
  storeContext?: {
    storeId: string;
    store: any;
  };
}

/**
 * Middleware to validate and attach store context from :storeId param
 * Ensures store exists and is active before proceeding
 */
export const validateStoreContext = async (
  req: StoreContextRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storeId } = req.params;

    if (!storeId || !isValidObjectId(storeId)) {
      throw new AppError('A valid store ID is required', 400);
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    if (!store.isActive) {
      throw new AppError('Store is inactive', 403);
    }

    req.storeContext = {
      storeId,
      store,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Must run after authenticate. Admins can manage every store; store owners can
 * only mutate resources belonging to a store they own.
 */
export const requireStoreAccess = (
  req: StoreContextRequest & AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const store = req.storeContext?.store;

  if (!store || !req.user) {
    return next(new AppError('Store access context is missing', 403));
  }

  if (req.user.role === 'admin' || String(store.owner) === req.user.id) {
    return next();
  }

  return next(new AppError('Not authorized to manage this store', 403));
};
