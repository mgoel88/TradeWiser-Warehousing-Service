import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tradewiser-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tradewiser-refresh-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
  appPermissions: {
    pricing_tool: boolean;
    logistics: boolean;
    warehousing: boolean;
  };
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      ...payload,
      tenant_id: payload.tenantId, // For Supabase RLS compatibility
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Long-lived refresh token
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'access') return null;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role,
      appPermissions: decoded.appPermissions
    };
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (decoded.type !== 'refresh') return null;
    
    return {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}
