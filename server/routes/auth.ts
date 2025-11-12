import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['farmer', 'warehouse_operator', 'buyer', 'admin']).default('farmer')
});

const loginSchema = z.object({
  email: z.string(), // Client is sending 'email' field, even if it contains a username
  password: z.string()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user (Simulating Supabase user creation and profile creation)
    // NOTE: The original Bolt-TradeWiser creates a tenant and a profile.
    // Since this project uses a simpler local storage, we will simulate the tenant/profile structure.
    
    // 1. Create a dummy tenant ID (since this project doesn't have a tenant table)
    // We will use a fixed dummy ID for all users for now.
    const DUMMY_TENANT_ID = 'tw-warehouse-tenant-id';

    // 2. Create user in local storage
    const user = await storage.createUser({
      username: data.email, // Using email as username for simplicity
      password: hashedPassword,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      authMethod: 'username_password',
      role: data.role,
      kycVerified: false,
      tenantId: DUMMY_TENANT_ID, // Add tenantId to the user model
      appPermissions: {
        pricing_tool: false,
        logistics: false,
        warehousing: true // Default access for this app
      }
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.toString(), // Convert to string to match Bolt-TradeWiser's Supabase ID format
      email: user.email,
      tenantId: DUMMY_TENANT_ID,
      role: user.role,
      appPermissions: user.appPermissions
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set cookies (Client will handle token storage, but we send them back)
    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        tenantId: DUMMY_TENANT_ID,
        role: user.role,
        appPermissions: user.appPermissions
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
	    if (error instanceof z.ZodError) {
	      console.error("Zod Validation Error:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ error: 'Validation error' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  console.log("--- LOGIN ATTEMPT ---");
  console.log("Request Body:", req.body);
  try {
    const { email: usernameOrEmail, password } = loginSchema.parse(req.body);

    // Determine if the input is an email or a username
    // Special case for the hardcoded test user 'testuser'
    let email: string;
    if (usernameOrEmail === 'testuser') {
      email = 'testuser@example.com';
    } else {
      const isEmail = usernameOrEmail.includes('@');
      email = isEmail ? usernameOrEmail : `${usernameOrEmail}@tradewiser.com`;
    }

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      email: user.email,
      tenantId: user.tenantId || 'tw-warehouse-tenant-id',
      role: user.role,
      appPermissions: user.appPermissions || { pricing_tool: false, logistics: false, warehousing: true }
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set cookies (Client will handle token storage, but we send them back)
    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        tenantId: tokenPayload.tenantId,
        role: user.role,
        appPermissions: tokenPayload.appPermissions
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Error:", error.errors);
      return res.status(400).json({ error: 'Validation error' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get latest user profile
    const user = await storage.getUserByEmail(payload.email);

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      email: user.email,
      tenantId: user.tenantId || 'tw-warehouse-tenant-id',
      role: user.role,
      appPermissions: user.appPermissions || { pricing_tool: false, logistics: false, warehousing: true }
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (clear cookies)
 */
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(parseInt(req.user.userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        role: user.role,
        appPermissions: user.appPermissions,
        // tenant: profile.tenants // Skipping tenant details for simplicity
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
