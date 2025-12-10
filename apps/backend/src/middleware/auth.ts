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
    console.log('[Auth Middleware] Authorization header:', authHeader?.substring(0, 50));
    
    // Try Bearer token first
    let token = authHeader?.split(' ')[1];
    
    // If no Bearer token, try session cookie
    if (!token && req.cookies?.session) {
      console.log('[Auth Middleware] No Bearer token, checking session cookie');
      token = req.cookies.session;
      
      // For session cookies, we need to decrypt them using the SESSION_SECRET
      // Session cookies use a different secret (SESSION_SECRET) than API tokens (JWT_SECRET)
      const SESSION_SECRET = process.env.SESSION_SECRET;
      if (SESSION_SECRET && token) {
        try {
          const sessionPayload = jwt.verify(token, SESSION_SECRET) as unknown as JwtPayload;
          console.log('[Auth Middleware] Session cookie decoded:', sessionPayload);
          
          req.user = {
            id: sessionPayload.userId || sessionPayload.id,
            email: sessionPayload.email,
            role: sessionPayload.role,
          };
          
          console.log('[Auth Middleware] Authentication successful via session cookie for user:', sessionPayload.email);
          return next();
        } catch (sessionError) {
          console.log('[Auth Middleware] Session cookie verification failed, will try JWT_SECRET');
          // Fall through to try JWT_SECRET
        }
      }
    }

    if (!token) {
      console.log('[Auth Middleware] No token found in header or cookies');
      throw new AppError('Authentication required', 401);
    }

    console.log('[Auth Middleware] Token extracted (first 20 chars):', token.substring(0, 20));

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    console.log('[Auth Middleware] Using JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    
    console.log('[Auth Middleware] Token decoded successfully:', decoded);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    console.log('[Auth Middleware] Authentication successful for user:', decoded.email);
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification failed:', error);
    next(new AppError('Invalid or expired token', 401));
  }
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
