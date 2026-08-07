import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  userId?: string; // For session cookie format
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Try Bearer token first
    let token = authHeader?.split(' ')[1];
    
    // If no Bearer token, try session cookie
    if (!token && req.cookies?.session) {
      token = req.cookies.session;
      
      // For session cookies, we need to decrypt them using the SESSION_SECRET
      // Session cookies use a different secret (SESSION_SECRET) than API tokens (JWT_SECRET)
      const SESSION_SECRET = process.env.SESSION_SECRET;
      if (SESSION_SECRET && token) {
        try {
          const sessionPayload = jwt.verify(token, SESSION_SECRET) as unknown as JwtPayload;
          req.user = {
            id: sessionPayload.userId || sessionPayload.id,
            email: sessionPayload.email,
            role: sessionPayload.role,
          };
          
          return next();
        } catch (sessionError) {
          // Fall through to try JWT_SECRET
        }
      }
    }

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.headers.authorization && !req.cookies?.session) {
    return next();
  }

  return authenticate(req, res, next);
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};
