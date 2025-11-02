import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import session from 'express-session';
import 'express-session';
import { verifyToken } from './utils/jwt';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const app = express();

// Enable CORS with credentials
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware for backward compatibility
app.use(session({
  secret: process.env.SESSION_SECRET || 'tradewiser-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: false, // Allow cookies over HTTP in development
    httpOnly: true,
    sameSite: 'lax', // Changed from default to explicit
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  }
}));
console.log('✅ Session middleware configured in index.ts');

// JWT-to-Session Bridge: Allow JWT tokens to work with session-based endpoints

app.use((req, res, next) => {
  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token) as any;
      if (payload && payload.userId) {
        // Populate session with userId from JWT
        req.session.userId = payload.userId;
        console.log('✅ [JWT-Bridge] Token validated, userId set in session:', payload.userId);
      }
    } catch (error: any) {
      console.log('⚠️ [JWT-Bridge] Invalid JWT token:', error.message);
    }
  }
  next();
});
console.log('✅ JWT-to-Session bridge configured');

// JWT authentication is also supported
// Tokens can be sent in Authorization header: "Bearer <token>"

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000; // Back to original port
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
