/**
 * Authentication Routes
 * Clean JWT-based authentication system
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { generateTokenPair, verifyToken } from '../utils/jwt';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  role: z.enum(['farmer', 'warehouse_operator', 'buyer', 'admin']).default('farmer')
});

const loginSchema = z.object({
  username: z.string(),
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

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(data.email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await storage.createUser({
      username: data.username,
      password: hashedPassword,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      authMethod: 'username_password',
      role: data.role,
      kycVerified: false
    });

    // Generate JWT tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          kycVerified: user.kycVerified
        },
        ...tokens
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Get user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    // Generate JWT tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);
    console.log('🔑 [AUTH.CLEAN] Generated tokens:', Object.keys(tokens));

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          kycVerified: user.kycVerified
        },
        ...tokens
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyToken(refreshToken) as any;
    
    if (!payload || !payload.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user to ensure they still exist
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, server just confirms)
 */
router.post('/logout', authenticateJWT, async (req: Request, res: Response) => {
  // With JWT, logout is primarily client-side (remove tokens)
  // Server can optionally blacklist tokens here if needed
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        kycVerified: user.kycVerified,
        profileImageUrl: user.profileImageUrl,
        businessDetails: user.businessDetails,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

export default router;
