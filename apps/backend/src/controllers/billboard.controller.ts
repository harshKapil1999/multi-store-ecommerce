import { Response, NextFunction } from 'express';
import { Billboard } from '../models/billboard.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { CreateBillboardInput, UpdateBillboardInput } from '../validators/billboard-category-product.schema';

export const listBillboards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20, categoryId } = req.query;

    const filter: any = { storeId };
    if (categoryId) {
      // If 'null' string is passed, filter for null categoryId (general billboards)
      filter.categoryId = categoryId === 'null' ? null : categoryId;
    }

    const [billboards, total] = await Promise.all([
      Billboard.find(filter)
        .sort({ order: 1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Billboard.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        data: billboards,
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

export const getBillboardById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const billboard = await Billboard.findById(id);

    if (!billboard) {
      throw new AppError('Billboard not found', 404);
    }

    res.json({ success: true, data: billboard });
  } catch (error) {
    next(error);
  }
};

export const createBillboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const input = req.body as CreateBillboardInput;

    const maxOrder = await Billboard.findOne({ storeId }).sort({ order: -1 }).select('order');
    const order = (maxOrder?.order ?? -1) + 1;

    const billboard = await Billboard.create({
      ...input,
      storeId,
      order,
    });

    res.status(201).json({ success: true, data: billboard });
  } catch (error) {
    next(error);
  }
};

export const updateBillboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = req.body as UpdateBillboardInput;

    const billboard = await Billboard.findById(id);
    if (!billboard) {
      throw new AppError('Billboard not found', 404);
    }

    Object.assign(billboard, input);
    await billboard.save();

    res.json({ success: true, data: billboard });
  } catch (error) {
    next(error);
  }
};

export const deleteBillboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const billboard = await Billboard.findById(id);
    if (!billboard) {
      throw new AppError('Billboard not found', 404);
    }

    await billboard.deleteOne();

    res.json({ success: true, message: 'Billboard deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const reorderBillboards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { storeId } = req.params;
    const { billboards } = req.body;

    // Update all billboards in the order specified
    await Promise.all(
      billboards.map((item: { id: string; order: number }) =>
        Billboard.findByIdAndUpdate(item.id, { order: item.order }, { new: true })
      )
    );

    const updated = await Billboard.find({ storeId }).sort({ order: 1 });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
