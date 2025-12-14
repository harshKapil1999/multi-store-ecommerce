import { Request, Response, NextFunction } from 'express';
import { Store } from '../models/store.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { CreateStoreInput, UpdateStoreInput, ToggleStoreInput } from '../validators/store.schema';

export const getAllStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const query: Record<string, any> = {};

    if (search) {
      query.$text = { $search: search };
    }

    const [stores, total] = await Promise.all([
      Store.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }),
      Store.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        data: stores,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const getStoreBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug, isActive: true })
      .populate('homeBillboards');

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    // Filter out null billboards (in case referenced billboard was deleted)
    if (store.homeBillboards && Array.isArray(store.homeBillboards)) {
      store.homeBillboards = store.homeBillboards.filter(b => b);
    }

    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const createStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateStoreInput;
    const existing = await Store.findOne({ slug: input.slug });
    if (existing) {
      throw new AppError('Slug already exists', 409);
    }
    const store = await Store.create({ ...input, owner: req.user!.id });
    res.status(201).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdateStoreInput;
    const store = await Store.findById(req.params.id);
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    if (store.owner !== req.user!.id && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to update this store', 403);
    }

    if (input.slug && input.slug !== store.slug) {
      const slugExists = await Store.findOne({ slug: input.slug });
      if (slugExists) {
        throw new AppError('Slug already exists', 409);
      }
    }

    Object.assign(store, input);
    await store.save();
    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    // Check ownership
    if (store.owner !== req.user!.id && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to delete this store', 403);
    }

    await store.deleteOne();

    res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleStoreActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = req.body as ToggleStoreInput;
    const store = await Store.findById(req.params.id);
    if (!store) {
      throw new AppError('Store not found', 404);
    }
    if (store.owner !== req.user!.id && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to toggle this store', 403);
    }

    store.isActive = typeof input.isActive === 'boolean' ? input.isActive : !store.isActive;
    await store.save();
    res.json({ success: true, data: { _id: store._id, isActive: store.isActive } });
  } catch (error) {
    next(error);
  }
};
