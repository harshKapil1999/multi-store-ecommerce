import { sql } from 'drizzle-orm';
import { getDB } from '../config/database';
import { OrderTable } from '../db/schema';
import { Request, Response, NextFunction } from 'express';
import { Store } from '../models/store.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { CreateStoreInput, UpdateStoreInput, ToggleStoreInput } from '../validators/store.schema';
import { Billboard } from '../models/billboard.model';
import { Category } from '../models/category.model';
import { Order } from '../models/order.model';
import { Transaction } from '../models/transaction.model';
import { Page } from '../models/page.model';
import { Product } from '../models/product.model';

const validateHomeSectionResources = async (storeId: string, sections: CreateStoreInput['homeSections']) => {
  if (!sections) return;

  const categoryIds = [...new Set(sections.flatMap((section) => section.categoryIds || []))];
  const productIds = [...new Set(sections.flatMap((section) => section.productIds || []))];
  const [categoryCount, productCount] = await Promise.all([
    categoryIds.length ? Category.countDocuments({ _id: { $in: categoryIds }, storeId }) : 0,
    productIds.length ? Product.countDocuments({ _id: { $in: productIds }, storeId }) : 0,
  ]);

  if (categoryCount !== categoryIds.length || productCount !== productIds.length) {
    throw new AppError('Home page selections must belong to this store', 400);
  }
};

export const getAllStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const query: Record<string, any> = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    const [stores, total] = await Promise.all([
      Store.find(query).select('-owner')
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

export const getAdminStores = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const query: Record<string, any> = req.user!.role === 'admin' ? {} : { owner: req.user!.id };
    if (search) query.$text = { $search: search };

    const [stores, total] = await Promise.all([
      Store.find(query).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }),
      Store.countDocuments(query),
    ]);

    res.json({ success: true, data: { data: stores, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const getStoreById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findOne({ _id: req.params.id, isActive: true }).select('-owner');

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const getAdminStoreById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query: Record<string, any> = { _id: req.params.id };
    if (req.user!.role !== 'admin') query.owner = req.user!.id;
    const store = await Store.findOne(query);
    if (!store) throw new AppError('Store not found', 404);
    res.json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const getStoreBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug, isActive: true })
      .select('-owner')
      .populate({ path: 'homeBillboards', match: { isActive: true } });

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    // Filter out null billboards (in case referenced billboard was deleted)
    if (store.homeBillboards && Array.isArray(store.homeBillboards)) {
      store.homeBillboards = store.homeBillboards.filter(b => b && String(b.storeId) === String(store._id));
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

    await validateHomeSectionResources(String(store._id), input.homeSections);
    if (input.homeBillboards && await Billboard.countDocuments({ _id: { $in: input.homeBillboards }, storeId: String(store._id) }) !== new Set(input.homeBillboards).size) throw new AppError('Hero slides must belong to this store.', 400);

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

    const storeId = String(store._id);
    const counts = await Promise.all([Order.countDocuments({storeId}), Transaction.countDocuments({storeId}), Product.countDocuments({storeId}), Category.countDocuments({storeId}), Billboard.countDocuments({storeId}), Page.countDocuments({storeId})]);
    if (counts.some(Boolean)) throw new AppError('This store contains records. Deactivate it to preserve customer and catalog history.', 409);
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

export const getStoreStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) throw new AppError('Store not found', 404);
    if (req.user!.role !== 'admin' && store.owner !== req.user!.id) throw new AppError('Not authorized', 403);
    const storeId = String(store._id);
    const [products, categories, orders, revenue, reviewOrders] = await Promise.all([
      Product.countDocuments({storeId}), Category.countDocuments({storeId}), Order.countDocuments({storeId}),
      getDB().select({ total: sql<number>`coalesce(sum(${OrderTable.total}), 0)`.mapWith(Number) }).from(OrderTable).where(sql`${OrderTable.storeId} = ${storeId} AND ${OrderTable.paymentStatus} = 'paid' AND ${OrderTable.status} NOT IN ('cancelled', 'refunded')`),
      Order.countDocuments({storeId, inventoryStatus:'review'})
    ]);
    res.json({success:true,data:{products,categories,orders,revenue:revenue[0]?.total || 0,reviewOrders}});
  } catch(error) { next(error); }
};
