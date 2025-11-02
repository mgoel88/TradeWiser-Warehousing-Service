import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { generateTokenPair, verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = Router();

console.log('✅ JWT Auth Router loaded successfully');

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  role: z.enum(['farmer', 'warehouse_operator', 'financier', 'admin']).optional()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

/**
 * POST /api/auth/login
 * Login with username and password, returns JWT tokens
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Get user from database
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = user.password ? 
      await bcrypt.compare(password, user.password) : 
      password === user.password; // Fallback for plain text (dev only)

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    // Set session for backward compatibility with session-based routes
    console.log('🔑 [authJWT/login] Setting userId in session:', user.id);
    console.log('🔑 [authJWT/login] Session before setting userId:', JSON.stringify(req.session));
    req.session.userId = user.id;
    console.log('🔑 [authJWT/login] Session after setting userId:', JSON.stringify(req.session));
    
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ [authJWT/login] Session save error:', err);
          reject(err);
        } else {
          console.log(`✅ [authJWT/login] Session saved successfully for user ${user.id}`);
          console.log('✅ [authJWT/login] Session ID:', req.sessionID);
          console.log('✅ [authJWT/login] Session data:', JSON.stringify(req.session));
          resolve();
        }
      });
    });

    // Generate JWT tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);

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
          authMethod: user.authMethod
        },
        ...tokens
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
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
 * POST /api/auth/register
 * Register a new user, returns JWT tokens
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const newUser = await storage.createUser({
      username: userData.username,
      password: hashedPassword,
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role || 'farmer',
      authMethod: 'username_password',
      phoneVerified: false,
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate JWT tokens
    const tokens = generateTokenPair(newUser.id, newUser.email, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role
        },
        ...tokens
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
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
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Get user to ensure they still exist and are active
    const user = await storage.getUser(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: tokens
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({
      success: false,
      message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          kycVerified: user.kycVerified
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side only with JWT, server just acknowledges)
 */
router.post('/logout', (req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  // Server can optionally implement token blacklisting here
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;
