import { canReadDrafts } from '../middleware/store-context';
import { Response, NextFunction } from 'express';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateStockInput,
} from '../validators/billboard-category-product.schema';
import { catalogFacets, listPackProducts } from '../services/catalog-facets.service';
import { searchProducts } from '../services/product-search.service';

export const listProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      category,
      packSize,
      minPrice,
      maxPrice,
      isFeatured,
      includeInactive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    if (packSize) {
      const data = await listPackProducts(storeId, { packSize: String(packSize), category: category as string | undefined,
        minPrice: minPrice === undefined ? undefined : Number(minPrice), maxPrice: maxPrice === undefined ? undefined : Number(maxPrice),
        page: Number(page), limit: Number(limit), sortBy: String(sortBy), sortOrder: String(sortOrder), search: search as string | undefined });
      res.json({ success: true, data });
      return;
    }

    const query: Record<string, any> = { storeId, ...(!canReadDrafts(req) ? { isActive: true } : {}) };

    // specialized category handling for recursive lookup
    if (category) {
      // Fetch all categories to build the tree and find descendants
      const allCategories = await Category.find({ storeId }).select('_id parentId').lean();

      const visited = new Set<string>();
      const getDescendants = (parentId: string): string[] => {
        if (visited.has(parentId)) return [];
        visited.add(parentId);
        const children = allCategories.filter(c => String(c.parentId) === parentId);
        let descendants: string[] = children.map(c => String(c._id));

        for (const child of children) {
          descendants = [...descendants, ...getDescendants(String(child._id))];
        }
        return descendants;
      };

      const categoryIds = [category as string, ...getDescendants(category as string)];
      query.categoryId = { $in: categoryIds };
    }

    if (String(isFeatured) === 'true') query.isFeatured = true;
    if (String(includeInactive) !== 'true' || !canReadDrafts(req)) query.isActive = true;

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    if (search) {
      const rankedProducts = await searchProducts(query, search);
      const currentPage = Number(page);
      const pageSize = Math.min(Number(limit), 100);
      const total = rankedProducts.length;

      res.json({
        success: true,
        data: {
          data: rankedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
          total,
          page: currentPage,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
      return;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1, _id: sortOrder === 'asc' ? 1 : -1 })
        .limit(Math.min(100, Math.max(1, Math.floor(Number(limit) || 10))))
        .skip((Number(page) - 1) * Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        data: products,
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

export const getCatalogFacets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await catalogFacets(req.params.storeId, req.query.category as string | undefined, req.query.packSize as string | undefined) });
  } catch (error) { next(error); }
};

export const getSearchSuggestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storeId } = req.params;
    const search = String(req.query.search ?? '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 10);

    if (search.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const matches = await searchProducts({ storeId, isActive: true }, search);
    const suggestions = matches.slice(0, limit).map((product) => ({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      featuredImage: product.featuredImage,
      sellingPrice: product.sellingPrice,
    }));

    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;

    const product = await Product.findOne({ _id: id, storeId, ...(!canReadDrafts(req) ? { isActive: true } : {}) });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId, slug } = req.params;

    const product = await Product.findOne({ storeId, slug, isActive: true });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storeId } = req.params;
    const { limit = 10 } = req.query;

    const products = await Product.find({
      storeId,
      isFeatured: true,
      isActive: true,
    })
      .limit(Math.min(100, Math.max(1, Math.floor(Number(limit) || 10))))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const input = req.body as CreateProductInput;

    const category = await Category.findOne({ _id: input.categoryId, storeId }).select('_id').lean();
    if (!category) {
      throw new AppError('Category does not belong to this store', 400);
    }

    if (input.sellingPrice > input.mrp) throw new AppError('Selling price must not exceed MRP.', 400);
    // Check slug uniqueness within store
    const existing = await Product.findOne({ storeId, slug: input.slug });
    if (existing) {
      throw new AppError('Slug already exists in this store', 409);
    }

    const product = await Product.create({
      ...input,
      storeId,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;
    const input = req.body as UpdateProductInput;

    const product = await Product.findOne({ _id: id, storeId });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.storeId !== storeId) {
      throw new AppError('Product does not belong to this store', 400);
    }

    if (input.slug && input.slug !== product.slug) {
      const slugExists = await Product.findOne({ storeId, slug: input.slug });
      if (slugExists) {
        throw new AppError('Slug already exists in this store', 409);
      }
    }

    if (input.categoryId && !(await Category.exists({_id: input.categoryId, storeId}))) throw new AppError('Category does not belong to this store', 400);
    if ((input.sellingPrice ?? product.sellingPrice) > (input.mrp ?? product.mrp)) throw new AppError('Selling price must not exceed MRP.', 400);
    Object.assign(product, input);
    await product.save();

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;
    const input = req.body as UpdateStockInput;

    const product = await Product.findOne({ _id: id, storeId });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.storeId !== storeId) {
      throw new AppError('Product does not belong to this store', 400);
    }

    product.stock = input.stock;
    await product.save();

    res.json({
      success: true,
      data: { _id: product._id, stock: product.stock },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, storeId } = req.params;

    const product = await Product.findOne({ _id: id, storeId });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.storeId !== storeId) {
      throw new AppError('Product does not belong to this store', 400);
    }

    await product.deleteOne();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
