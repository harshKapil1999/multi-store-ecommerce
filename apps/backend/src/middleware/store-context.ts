import { Request, Response, NextFunction } from 'express';
import { Store } from '../models/store.model';
import { AppError } from './error-handler';

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

    if (!storeId) {
      throw new AppError('Store ID is required', 400);
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
