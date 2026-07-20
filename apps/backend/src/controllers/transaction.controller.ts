import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/transaction.model';
import { Store } from '../models/store.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

const getAccessibleStoreIds = async (req: AuthRequest) => {
    if (req.user!.role === 'admin') return null;

    const stores = await Store.find({ owner: req.user!.id }).select('_id').lean();
    return stores.map((store) => String(store._id));
};

export const getAllTransactions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { page = 1, limit = 20, status, storeId } = req.query;
        const query: any = {};

        if (status) query.status = status;
        if (storeId) query.storeId = storeId;

        const accessibleStoreIds = await getAccessibleStoreIds(req);
        if (accessibleStoreIds) {
            if (storeId && !accessibleStoreIds.includes(String(storeId))) {
                throw new AppError('Not authorized to view this store', 403);
            }

            query.storeId = storeId ? String(storeId) : { $in: accessibleStoreIds };
        }

        const transactions = await Transaction.find(query)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: {
                data: transactions,
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

export const getTransactionById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            throw new AppError('Transaction not found', 404);
        }

        const accessibleStoreIds = await getAccessibleStoreIds(req);
        if (accessibleStoreIds && !accessibleStoreIds.includes(transaction.storeId)) {
            throw new AppError('Not authorized to view this transaction', 403);
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};

export const getTransactionsByStore = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        if (req.user!.role !== 'admin') {
            const accessibleStoreIds = await getAccessibleStoreIds(req);
            if (!accessibleStoreIds?.includes(storeId)) {
                throw new AppError('Not authorized to view this store', 403);
            }
        }

        const query: any = { storeId };
        if (status) query.status = status;

        const transactions = await Transaction.find(query)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: {
                data: transactions,
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

export const getTransactionByOrderId = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { orderId } = req.params;

        const transaction = await Transaction.findOne({ orderId });

        if (!transaction) {
            throw new AppError('Transaction not found', 404);
        }

        const accessibleStoreIds = await getAccessibleStoreIds(req);
        if (accessibleStoreIds && !accessibleStoreIds.includes(transaction.storeId)) {
            throw new AppError('Not authorized to view this transaction', 403);
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};
