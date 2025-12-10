import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodIssue, ZodSchema } from 'zod';
import { AppError } from './error-handler';

type Location = 'body' | 'query' | 'params';

/**
 * validate - Zod-based request validator
 * Usage: router.post('/', validate(schema), handler)
 */
export const validate = (schema: ZodSchema, location: Location = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = (req as any)[location];
      const parsed = schema.parse(data);
      (req as any)[location] = parsed; // overwrite with parsed/stripped values
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues: ZodIssue[] = err.issues;
        const message = issues
          .map((e: ZodIssue) => `${e.path.join('.') || '(root)'}: ${e.message}`)
          .join(', ');
        return next(new AppError(`Validation failed: ${message}`, 400));
      }
      next(err);
    }
  };
};
