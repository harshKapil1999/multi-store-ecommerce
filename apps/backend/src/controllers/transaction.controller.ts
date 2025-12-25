import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/transaction.model';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

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

        // If not admin, only show own store transactions
        if (req.user!.role === 'store_owner') {
            // TODO: Get stores owned by user
            // For now, filter by storeId from query
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
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            throw new AppError('Transaction not found', 404);
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
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { orderId } = req.params;

        const transaction = await Transaction.findOne({ orderId });

        if (!transaction) {
            throw new AppError('Transaction not found', 404);
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};
