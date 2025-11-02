import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // Verify token
    const payload: JWTPayload = verifyToken(token);

    // Check if it's an access token (not a refresh token)
    if (payload.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    
    return res.status(401).json({
      success: false,
      message
    });
  }
}

/**
 * Optional JWT Authentication Middleware
 * Attaches user info if token is present, but doesn't require it
 */
export function optionalAuthenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload: JWTPayload = verifyToken(token);
      
      if (payload.type === 'access') {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        };
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware
 * Must be used after authenticateJWT
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}
