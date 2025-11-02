interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.startCleanup();
  }

  checkLimit(req: any): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const now = Date.now();
    
    let entry = this.cache.get(key);
    
    // Initialize or reset if window has passed
    if (!entry || now >= entry.resetTime) {
      entry = {
        requests: 0,
        resetTime: now + this.config.windowMs
      };
      this.cache.set(key, entry);
    }
    
    entry.requests++;
    const remaining = Math.max(0, this.config.maxRequests - entry.requests);
    const allowed = entry.requests <= this.config.maxRequests;
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }

  private getDefaultKey(req: any): string {
    // Use API key if available, otherwise IP address
    const apiKey = req.headers['x-api-key'];
    if (apiKey) return `api-${apiKey}`;
    
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    return `ip-${ip}`;
  }

  private startCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (now >= entry.resetTime) {
          toDelete.push(key);
        }
      }
      
      toDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Rate limiter cleanup: removed ${toDelete.length} expired entries`);
    }, 5 * 60 * 1000);
  }
}

// Middleware factory
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);

  return (req: any, res: any, next: any) => {
    const result = limiter.checkLimit(req);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    });
    
    if (!result.allowed) {
      console.warn(`🚫 Rate limit exceeded for ${limiter.getDefaultKey(req)}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    next();
  };
}

// Predefined rate limiters
export const webhookRateLimiter = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: parseInt(process.env.WEBHOOK_RATE_LIMIT || '100'),
  keyGenerator: (req) => {
    // Rate limit by API key for webhooks
    const apiKey = req.headers['x-api-key'];
    return apiKey ? `webhook-${apiKey}` : `webhook-ip-${req.ip}`;
  }
});

export const adminRateLimiter = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 30, // Lower limit for admin endpoints
  keyGenerator: (req) => {
    // Rate limit by user session for admin
    const userId = req.session?.userId;
    return userId ? `admin-${userId}` : `admin-ip-${req.ip}`;
  }
});

export const generalRateLimiter = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // Higher limit for general API
  keyGenerator: (req) => `general-ip-${req.ip}`
});