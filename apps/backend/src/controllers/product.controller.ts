import { Response, NextFunction } from 'express';
import { Product } from '../models/product.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateStockInput,
} from '../validators/billboard-category-product.schema';

export const listProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: Record<string, any> = { storeId };
    if (category) query.categoryId = category;
    if (search) query.$text = { $search: search as string };
    if (isFeatured === 'true') query.isFeatured = true;

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .limit(Number(limit))
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

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
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
      .limit(Number(limit))
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

    const product = await Product.findById(id);
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

    const product = await Product.findById(id);
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

    const product = await Product.findById(id);
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
