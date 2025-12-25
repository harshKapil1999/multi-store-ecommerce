import { Request, Response, NextFunction } from 'express';
import { ProductVariant } from '../models/variant.model';
import { Product } from '../models/product.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

export const getVariantsByProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const variants = await ProductVariant.find({ productId, isActive: true });

        res.json({ success: true, data: variants });
    } catch (error) {
        next(error);
    }
};

export const getVariantById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const variant = await ProductVariant.findById(req.params.id);

        if (!variant) {
            throw new AppError('Variant not found', 404);
        }

        res.json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

export const createVariant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params;
        const { name, sku, price, stock, attributes, isActive } = req.body;

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        // Check if product has variants enabled
        if (!product.hasVariants) {
            throw new AppError('Product does not support variants', 400);
        }

        // Check if SKU already exists
        const existingSku = await ProductVariant.findOne({ sku });
        if (existingSku) {
            throw new AppError('SKU already exists', 400);
        }

        const variant = await ProductVariant.create({
            productId,
            name,
            sku,
            price,
            stock,
            attributes,
            isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

export const updateVariant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, sku, price, stock, attributes, isActive } = req.body;

        const variant = await ProductVariant.findById(req.params.id);
        if (!variant) {
            throw new AppError('Variant not found', 404);
        }

        // Check if new SKU conflicts with existing
        if (sku && sku !== variant.sku) {
            const existingSku = await ProductVariant.findOne({ sku });
            if (existingSku) {
                throw new AppError('SKU already exists', 400);
            }
        }

        if (name !== undefined) variant.name = name;
        if (sku !== undefined) variant.sku = sku;
        if (price !== undefined) variant.price = price;
        if (stock !== undefined) variant.stock = stock;
        if (attributes !== undefined) variant.attributes = attributes;
        if (isActive !== undefined) variant.isActive = isActive;

        await variant.save();

        res.json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

export const deleteVariant = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const variant = await ProductVariant.findByIdAndDelete(req.params.id);

        if (!variant) {
            throw new AppError('Variant not found', 404);
        }

        res.json({ success: true, message: 'Variant deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateVariantStock = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            throw new AppError('Invalid stock value', 400);
        }

        const variant = await ProductVariant.findById(req.params.id);
        if (!variant) {
            throw new AppError('Variant not found', 404);
        }

        variant.stock = stock;
        await variant.save();

        res.json({ success: true, data: variant });
    } catch (error) {
        next(error);
    }
};

export const bulkCreateVariants = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params;
        const { variants } = req.body;

        if (!Array.isArray(variants) || variants.length === 0) {
            throw new AppError('Variants array is required', 400);
        }

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (!product.hasVariants) {
            throw new AppError('Product does not support variants', 400);
        }

        // Check for duplicate SKUs
        const skus = variants.map((v: any) => v.sku);
        const existingSkus = await ProductVariant.find({ sku: { $in: skus } });
        if (existingSkus.length > 0) {
            throw new AppError('One or more SKUs already exist', 400);
        }

        const createdVariants = await ProductVariant.insertMany(
            variants.map((v: any) => ({
                ...v,
                productId,
            }))
        );

        res.status(201).json({ success: true, data: createdVariants });
    } catch (error) {
        next(error);
    }
};
