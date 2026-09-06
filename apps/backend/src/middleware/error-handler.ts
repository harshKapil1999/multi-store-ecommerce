import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const databaseError = err as ApiError & { code?: number; name?: string };
  const statusCode = err.statusCode || (databaseError.code === 11000 ? 409 : ['ValidationError', 'CastError', 'ZodError'].includes(err.name) ? 400 : 500);
  const message = databaseError.code === 11000 ? 'This record already exists.'
    : statusCode >= 500 ? 'The service is temporarily unavailable. Please try again.'
    : statusCode === 400 && !(err instanceof AppError) ? 'Invalid request data.' : err.message;
  if (statusCode >= 500) console.error('Request failed', { name: err.name, statusCode });
  res.status(statusCode).json({ success: false, message, error: message });

};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
