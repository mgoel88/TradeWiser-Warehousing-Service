import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { otpService } from '../services/OTPService';
import { socialAuthService } from '../services/SocialAuthService';
import { z } from 'zod';

const authRouter = Router();

// Validation schemas
const sendOTPSchema = z.object({
  phone: z.string().min(10).max(15),
  purpose: z.enum(['login', 'registration', 'password_reset']).default('login')
});

const verifyOTPSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
  purpose: z.enum(['login', 'registration', 'password_reset']).default('login'),
  userData: z.object({
    fullName: z.string().min(2),
    email: z.string().email().optional(),
  }).optional()
});

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['farmer', 'trader', 'warehouse_owner', 'logistics_provider']).default('farmer')
});

const socialAuthSchema = z.object({
  provider: z.enum(['google', 'facebook']),
  token: z.string().min(10)
});

/**
 * PHONE/OTP AUTHENTICATION ROUTES
 */

// Send OTP to phone number
authRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone, purpose } = sendOTPSchema.parse(req.body);

    // For registration, check if phone already exists
    if (purpose === 'registration') {
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered. Try logging in instead.'
        });
      }
    }

    const result = await otpService.sendOTP(phone, purpose);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: { 
          phone: phone,
          expiresIn: 300 // 5 minutes
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP and login/register
authRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp, purpose, userData } = verifyOTPSchema.parse(req.body);

    const verification = await otpService.verifyOTP(phone, otp, purpose);
    
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    let user;

    if (purpose === 'registration') {
      // Create new user
      if (!userData) {
        return res.status(400).json({
          success: false,
          message: 'User data required for registration'
        });
      }

      user = await storage.createUser({
        phone: phone,
        fullName: userData.fullName,
        email: userData.email,
        authMethod: 'phone_otp',
        phoneVerified: true,
        role: 'farmer'
      });
    } else {
      // Login existing user
      user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number. Please register first.'
        });
      }

      // Update last login
      await storage.updateUser(user.id, {
        lastLogin: new Date(),
        phoneVerified: true
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.save();

    res.json({
      success: true,
      message: purpose === 'registration' ? 'Account created successfully' : 'Login successful',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
});

/**
 * USERNAME/PASSWORD AUTHENTICATION ROUTES  
 */

// Traditional login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password (assuming bcrypt hashing)
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

    // Set session
    req.session.userId = user.id;
    req.session.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Traditional registration
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, phone, role } = registerSchema.parse(req.body);

    // Check if username or email already exists
    const existingUser = await storage.getUserByUsername(username) || 
                         await storage.getUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      fullName,
      email,
      phone,
      authMethod: 'username_password',
      emailVerified: false,
      phoneVerified: false,
      role
    });

    // Set session
    req.session.userId = user.id;
    req.session.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/**
 * SOCIAL AUTHENTICATION ROUTES
 */

// Social login (Google/Facebook)
authRouter.post('/social-login', async (req: Request, res: Response) => {
  try {
    const { provider, token } = socialAuthSchema.parse(req.body);

    let user;

    if (provider === 'google') {
      const profile = await socialAuthService.verifyGoogleToken(token);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token'
        });
      }
      user = await socialAuthService.findOrCreateGoogleUser(profile);
    } else if (provider === 'facebook') {
      const profile = await socialAuthService.verifyFacebookToken(token);
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Facebook token'
        });
      }
      user = await socialAuthService.findOrCreateFacebookUser(profile);
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Social authentication failed'
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.save();

    res.json({
      success: true,
      message: 'Social login successful',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod,
          profileImageUrl: user.profileImageUrl
        }
      }
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Social authentication failed'
    });
  }
});

/**
 * COMMON AUTHENTICATION ROUTES
 */

// Get current session
authRouter.get('/session', async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          authMethod: user.authMethod,
          profileImageUrl: user.profileImageUrl,
          kycVerified: user.kycVerified
        }
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Session check failed'
    });
  }
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

export default authRouter;