import { canReadDrafts } from '../middleware/store-context';
import { Response, NextFunction } from 'express';
import { Product } from '../models/product.model';
import { Billboard } from '../models/billboard.model';
import { Category } from '../models/category.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/billboard-category-product.schema';

async function validateCategoryLinks(storeId: string, input: CreateCategoryInput | UpdateCategoryInput, id?: string) {
  if (input.billboards && await Billboard.countDocuments({ _id: { $in: input.billboards }, storeId }) !== new Set(input.billboards).size) throw new AppError('Billboards must belong to this store.', 400);
  let parentId = input.parentId;
  const seen = new Set(id ? [id] : []);
  while (parentId) {
    if (seen.has(parentId)) throw new AppError('A category cannot contain itself.', 400);
    seen.add(parentId);
    const parent = await Category.findOne({ _id: parentId, storeId }).select('parentId').lean();
    if (!parent) throw new AppError('Parent category must belong to this store.', 400);
    parentId = parent.parentId;
  }
}

export const listCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20, isFeatured } = req.query;

    const query: Record<string, any> = { storeId, ...(!canReadDrafts(req) ? { isActive: true } : {}) };
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    const [categories, total] = await Promise.all([
      Category.find(query)
        .sort({ order: 1, name: 1 })
        .limit(Math.min(100, Math.max(1, Math.floor(Number(limit) || 20))))
        .skip((Math.max(1, Math.floor(Number(page) || 1)) - 1) * Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)))),
      Category.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        data: categories,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;

    const category = await Category.findOne({ _id: id, storeId, ...(!canReadDrafts(req) ? { isActive: true } : {}) });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storeId } = req.params;

    const categories = await Category.find({
      storeId,
      isFeatured: true,
      isActive: true,
    }).sort({ order: 1 });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const input = req.body as CreateCategoryInput;
    await validateCategoryLinks(storeId, input);

    // Check slug uniqueness within store
    const existing = await Category.findOne({ storeId, slug: input.slug });
    if (existing) {
      throw new AppError('Slug already exists in this store', 409);
    }

    const maxOrder = await Category.findOne({ storeId }).sort({ order: -1 }).select('order');
    const order = (maxOrder?.order ?? -1) + 1;

    const category = await Category.create({
      ...input,
      storeId,
      order: input.order ?? order,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;
    const input = req.body as UpdateCategoryInput;
    await validateCategoryLinks(storeId, input, id);

    const category = await Category.findOne({ _id: id, storeId });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category.storeId !== storeId) {
      throw new AppError('Category does not belong to this store', 400);
    }

    if (input.slug && input.slug !== category.slug) {
      const slugExists = await Category.findOne({ storeId, slug: input.slug });
      if (slugExists) {
        throw new AppError('Slug already exists in this store', 409);
      }
    }

    Object.assign(category, input);
    await category.save();

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;

    const category = await Category.findOne({ _id: id, storeId });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category.storeId !== storeId) {
      throw new AppError('Category does not belong to this store', 400);
    }

    if (await Product.exists({ storeId, categoryId: id }) || await Category.exists({ storeId, parentId: id })) throw new AppError('Move or remove products and child categories before deleting this category.', 409);
    await category.deleteOne();

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId, slug } = req.params;

    const category = await Category.findOne({ storeId, slug, isActive: true })
      .populate({ path: 'billboards', match: { isActive: true } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Filter out null billboards
    if (category.billboards && Array.isArray(category.billboards)) {
      category.billboards = category.billboards.filter(b => b);
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const getCategoryTree = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;

    const categories = await Category.find({
      storeId,
      isActive: true,
    }).sort({ order: 1 });

    const categoryMap = new Map();
    const roots: any[] = [];

    // Initialize map
    categories.forEach((cat: any) => {
      const category = cat.toObject();
      categoryMap.set(String(cat._id), { ...category, children: [] });
    });

    // Build tree
    categoryMap.forEach((cat: any) => {
      if (cat.parentId && categoryMap.has(String(cat.parentId))) {
        const parent = categoryMap.get(String(cat.parentId));
        parent.children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    res.json({ success: true, data: roots });
  } catch (error) {
    next(error);
  }
};
