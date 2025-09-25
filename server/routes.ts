import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import path from "path";
import crypto from 'crypto';
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import IntegrationMonitoringService from "./services/IntegrationMonitoringService";
import RetryService from "./services/RetryService";
import { webhookRateLimiter, adminRateLimiter, generalRateLimiter } from "./middleware/rateLimiter";
import authRouter from "./routes/auth";
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Initialize monitoring and retry services
  const monitoringService = new IntegrationMonitoringService();
  const retryService = new RetryService();
  
  console.log("Registering API routes...");

  // Session validation middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // OLD Auth routes - REPLACED with comprehensive auth system at /api/auth
  /*
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  */

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      console.log('=== LOGIN DEBUG ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { username, password } = req.body;
      console.log('Extracted credentials:', { username, password: password ? '***' : 'MISSING' });
      
      if (!username || !password) {
        console.log('VALIDATION FAILED: Missing username or password');
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      console.log('User found:', user ? `ID: ${user.id}, Username: ${user.username}` : 'NOT FOUND');
      
      if (!user) {
        console.log("Login attempt failed: Username not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log('Password comparison:', { provided: password, stored: user.password, matches: user.password === password });
      const isValidPassword = user.password === password;
      
      if (!isValidPassword) {
        console.log("Login attempt failed: Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      // Seed demo bank accounts for demo purposes
      try {
        await storage.seedDemoBankAccounts(user.id);
        console.log(`Demo bank accounts seeded for user ${user.id}`);
      } catch (error) {
        console.error(`Failed to seed demo bank accounts for user ${user.id}:`, error);
        // Don't fail the login if bank account seeding fails
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/auth/session", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Ensure demo bank accounts are seeded for existing sessions
      try {
        await storage.seedDemoBankAccounts(user.id);
      } catch (error) {
        console.error(`Failed to seed demo bank accounts for user ${user.id}:`, error);
        // Don't fail the session check if bank account seeding fails
      }

      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User settings routes
  apiRouter.get("/user/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      // Return default settings if none exist
      const defaultSettings = {
        notifications: {
          email: true,
          sms: true,
          push: true,
          depositUpdates: true,
          receiptGeneration: true,
          loanAlerts: true,
          priceAlerts: false
        },
        preferences: {
          language: 'en-in',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          theme: 'light',
          dashboardLayout: 'default'
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 60,
          loginNotifications: true
        }
      };
      res.json(defaultSettings);
    }
  });

  apiRouter.patch("/user/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const settingsUpdate = req.body;
      
      const updatedSettings = await storage.updateUserSettings(userId, settingsUpdate);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  apiRouter.post("/user/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      // Get current user to verify password
      const user = await storage.getUser(userId);
      if (!user || user.password !== currentPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update password
      await storage.updateUserPassword(userId, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Warehouse routes
  apiRouter.get("/warehouses", async (req: Request, res: Response) => {
    try {
      console.log("GET /api/warehouses called");
      const warehouses = await storage.listWarehouses();
      console.log(`Found ${warehouses.length} warehouses`);
      res.setHeader('Content-Type', 'application/json');
      return res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  // Nearby warehouses endpoint
  apiRouter.get("/warehouses/nearby", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const searchRadius = parseInt((radius as string) || "50"); // Default 50km radius
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid latitude or longitude" });
      }
      
      console.log(`Searching nearby warehouses: lat=${latitude}, lng=${longitude}, radius=${searchRadius}km`);
      const warehouses = await storage.listWarehousesByLocation(latitude, longitude, searchRadius);
      
      // Add distance calculation to each warehouse
      const warehousesWithDistance = warehouses.map(warehouse => {
        const warehouseLat = parseFloat(warehouse.latitude || '0');
        const warehouseLng = parseFloat(warehouse.longitude || '0');
        
        // Haversine formula for accurate distance calculation
        const R = 6371; // Earth's radius in kilometers
        const dLat = (warehouseLat - latitude) * Math.PI / 180;
        const dLng = (warehouseLng - longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(warehouseLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
          ...warehouse,
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
        };
      }).sort((a, b) => a.distance - b.distance); // Sort by distance
      
      console.log(`Found ${warehousesWithDistance.length} nearby warehouses`);
      res.json(warehousesWithDistance);
    } catch (error) {
      console.error("Error fetching nearby warehouses:", error);
      res.status(500).json({ message: "Failed to fetch nearby warehouses" });
    }
  });

  apiRouter.get("/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const warehouse = await storage.getWarehouse(id);
      
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse" });
    }
  });

  // Enhanced warehouse query endpoints - fix route ordering
  apiRouter.get("/warehouses/by-state/:state", async (req: Request, res: Response) => {
    try {
      const state = decodeURIComponent(req.params.state);
      console.log(`Fetching warehouses for state: ${state}`);
      const warehouses = await storage.getWarehousesByState(state);
      console.log(`Found ${warehouses.length} warehouses in ${state}`);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses by state:", error);
      res.status(500).json({ message: "Failed to fetch warehouses by state", error: error instanceof Error ? error.message : String(error) });
    }
  });

  apiRouter.get("/warehouses/by-district/:district", async (req: Request, res: Response) => {
    try {
      const district = req.params.district;
      const warehouses = await storage.getWarehousesByDistrict(district);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses by district:", error);
      res.status(500).json({ message: "Failed to fetch warehouses by district" });
    }
  });

  apiRouter.get("/warehouses/by-commodity/:commodity", async (req: Request, res: Response) => {
    try {
      const commodity = req.params.commodity;
      const warehouses = await storage.getWarehousesByCommodity(commodity);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses by commodity:", error);
      res.status(500).json({ message: "Failed to fetch warehouses by commodity" });
    }
  });

  // Seed mandi warehouses endpoint
  apiRouter.post("/warehouses/seed-mandi-data", async (req: Request, res: Response) => {
    try {
      // Clear existing warehouses first (optional, can be removed if needed)
      const seededCount = await storage.seedMandiWarehouses();
      res.json({ 
        message: `Successfully seeded ${seededCount} mandi-based warehouses`,
        count: seededCount 
      });
    } catch (error) {
      console.error("Error seeding mandi warehouses:", error);
      res.status(500).json({ message: "Failed to seed mandi warehouses" });
    }
  });

  // Commodity routes
  apiRouter.get("/commodities", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const commodities = await storage.listCommoditiesByOwner(req.session.userId);
      res.setHeader('Content-Type', 'application/json');
      res.json(commodities);
    } catch (error) {
      console.error("Error fetching commodities:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch commodities" });
    }
  });

  // Get individual commodity
  apiRouter.get("/commodities/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }
      
      // Verify ownership
      if (commodity.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.json(commodity);
    } catch (error) {
      console.error("Error fetching commodity:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch commodity" });
    }
  });

  // Create new commodity
  apiRouter.post("/commodities", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Creating new commodity:", req.body);
      
      const {
        name,
        type,
        quantity,
        measurementUnit,
        qualityParameters,
        gradeAssigned,
        warehouseId,
        notes,
        valuation
      } = req.body;

      // Validate required fields
      if (!name || !type || !quantity || !warehouseId) {
        return res.status(400).json({
          message: "Missing required fields: name, type, quantity, warehouseId"
        });
      }

      const commodityData = {
        name,
        type,
        quantity: quantity.toString(),
        measurementUnit: measurementUnit || "MT",
        qualityParameters: qualityParameters || {},
        gradeAssigned: gradeAssigned || "pending",
        warehouseId: parseInt(warehouseId),
        ownerId: req.session.userId,
        status: "active" as const,
        channelType: "green" as const,
        valuation: valuation?.toString() || (parseFloat(quantity) * 1000 * 50).toString() // Rs 50 per kg default (MT to kg conversion)
      };

      const commodity = await storage.createCommodity(commodityData);
      
      console.log("Commodity created:", commodity.id);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(commodity);
    } catch (error) {
      console.error("Error creating commodity:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to create commodity" });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/', 
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedExtensions = /\.(jpeg|jpg|png|pdf|csv|xlsx|xls)$/i;
      const allowedMimes = /image\/(jpeg|jpg|png)|application\/(pdf|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|octet-stream)|text\/csv/;
      
      const fileType = allowedExtensions.test(file.originalname.toLowerCase());
      const mimeType = allowedMimes.test(file.mimetype);
      
      // For CSV files with generic MIME type, rely more on extension
      if ((fileType && file.originalname.toLowerCase().endsWith('.csv')) || (mimeType && fileType)) {
        return cb(null, true);
      } else {
        console.log("File rejected:", {filename: file.originalname, mimetype: file.mimetype});
        cb(new Error('Only image, PDF, CSV, and Excel files are allowed'));
      }
    }
  });

  // Receipt routes
  apiRouter.get("/receipts", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const receipts = await storage.listWarehouseReceiptsByOwner(req.session.userId);
      res.setHeader('Content-Type', 'application/json');
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  // Import external warehouse receipt via file upload (Orange Channel)
  apiRouter.post("/receipts/upload", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log("Processing external receipt upload...");
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.session!.userId;
      
      // For demo purposes, we'll simulate document parsing and create an external receipt
      // In production, this would involve OCR, PDF parsing, etc.
      
      const mockParsedData = {
        receiptNumber: `EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        externalSource: req.file.originalname.split('.')[0] || 'external_warehouse',
        commodityName: 'wheat', // Would be extracted from document
        quantity: '50', // Would be extracted from document  
        measurementUnit: 'MT',
        warehouseId: 1, // Default external warehouse
        status: 'active' as const,
        channelType: 'orange' as const, // Orange channel for external imports
        valuation: '125000', // Would be calculated based on extracted data
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        blockchainHash: `0x${Math.random().toString(16).substring(2, 18)}`,
        liens: {
          externalImport: true,
          originalWarehouse: req.file.originalname.split('.')[0],
          uploadedFile: req.file.filename,
          verificationStatus: 'pending_verification'
        }
      };

      // Create the warehouse receipt
      const receipt = await storage.createWarehouseReceipt({
        receiptNumber: mockParsedData.receiptNumber,
        commodityId: null, // No commodity for external imports initially
        warehouseId: mockParsedData.warehouseId,
        ownerId: userId,
        quantity: mockParsedData.quantity,
        measurementUnit: mockParsedData.measurementUnit,
        status: mockParsedData.status,
        blockchainHash: mockParsedData.blockchainHash,
        valuation: mockParsedData.valuation,
        externalId: mockParsedData.receiptNumber,
        externalSource: mockParsedData.externalSource,
        commodityName: mockParsedData.commodityName,
        warehouseName: `External-${mockParsedData.externalSource}`,
        attachmentUrl: req.file.path,
        metadata: JSON.stringify({
          type: 'external_receipt',
          originalFilename: req.file.originalname,
          uploadedFilename: req.file.filename,
          uploadPath: req.file.path,
          timestamp: new Date().toISOString(),
          insuranceCoverage: (parseFloat(mockParsedData.valuation) * 0.6).toString(),
          issuedDate: mockParsedData.issuedDate,
          expiryDate: mockParsedData.expiryDate
        }),
        liens: JSON.stringify(mockParsedData.liens)
      });

      console.log("External receipt imported:", receipt.id);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json({
        success: true,
        receipt: receipt,
        message: 'External warehouse receipt successfully imported via Orange Channel',
        extractedData: mockParsedData,
        verificationStatus: 'pending_verification'
      });

    } catch (error) {
      console.error("Error importing external receipt:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        message: "Failed to import external receipt",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Query external receipts (Orange Channel)
  apiRouter.get("/receipts/external", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      // Get all warehouse receipts for orange channel (external imports)
      const allReceipts = await storage.listWarehouseReceiptsByOwner(userId);
      const externalReceipts = allReceipts.filter(receipt => 
        receipt.externalSource || 
        (receipt.metadata && typeof receipt.metadata === 'string' && receipt.metadata.includes('external_receipt'))
      );
      
      res.setHeader('Content-Type', 'application/json');
      res.json(externalReceipts);
    } catch (error) {
      console.error("Error fetching external receipts:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch external receipts" });
    }
  });

  // Query disputed receipts (Red Channel)
  apiRouter.get("/receipts/disputed", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      
      // For now, return mock disputed receipts data since we don't have a disputes table
      // In production, this would query a disputes table with foreign key to receipts
      const mockDisputed = [
        {
          id: 1,
          receiptNumber: 'WR577619-1',
          commodityName: 'Wheat',
          quantity: '25.5',
          valuation: '637500',
          disputeReason: 'Quality parameters do not match expected standards',
          disputeType: 'quality',
          status: 'under_review',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          resolutionNote: null
        },
        {
          id: 2,
          receiptNumber: 'EXT-1757324-456',
          commodityName: 'Rice',
          quantity: '15.0',
          valuation: '375000',
          disputeReason: 'Quantity discrepancy found during verification',
          disputeType: 'quantity',
          status: 'resolved',
          priority: 'medium',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          resolutionNote: 'Discrepancy resolved through re-weighing. Quantity confirmed accurate.'
        }
      ];
      
      res.setHeader('Content-Type', 'application/json');
      res.json(mockDisputed);
    } catch (error) {
      console.error("Error fetching disputed receipts:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch disputed receipts" });
    }
  });

  // Submit new dispute (Red Channel)
  apiRouter.post("/receipts/dispute", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { receiptNumber, disputeType, priority, description, evidence } = req.body;
      
      if (!receiptNumber || !disputeType || !description) {
        return res.status(400).json({ message: "Receipt number, dispute type, and description are required" });
      }
      
      // For demo purposes, we'll simulate creating a dispute
      // In production, this would create entries in a disputes table
      const dispute = {
        id: Date.now(),
        receiptNumber,
        disputeType,
        priority: priority || 'medium',
        disputeReason: description,
        evidence: evidence || null,
        status: 'disputed',
        createdAt: new Date().toISOString(),
        userId
      };
      
      console.log("Dispute filed:", dispute);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json({
        success: true,
        dispute,
        message: 'Dispute filed successfully and sent to Red Channel for review'
      });
    } catch (error) {
      console.error("Error filing dispute:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to file dispute" });
    }
  });

  // Loans routes
  apiRouter.get("/loans", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const loans = await storage.listLoansByUser(req.session.userId);
      res.setHeader('Content-Type', 'application/json');
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });


  // Process routes (for deposits and workflows)
  apiRouter.get("/processes", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const processes = await storage.listProcessesByUser(req.session.userId);
      res.setHeader('Content-Type', 'application/json');
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch processes" });
    }
  });

  apiRouter.get("/processes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const process = await storage.getProcess(id);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.json(process);
    } catch (error) {
      console.error("Error fetching process:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch process" });
    }
  });

  // Update process status
  apiRouter.patch("/processes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const process = await storage.getProcess(id);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }
      
      // Verify ownership
      if (process.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log("Updating process:", id, req.body);
      
      const updatedProcess = await storage.updateProcess(id, req.body);
      
      res.setHeader('Content-Type', 'application/json');
      res.json(updatedProcess);
    } catch (error) {
      console.error("Error updating process:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to update process" });
    }
  });

  // Create warehouse receipts
  apiRouter.post("/receipts", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Creating warehouse receipt:", req.body);
      
      // FIXED: Ensure valuation defaults to Rs 50/kg if not provided (1 MT = 1000 kg)
      const { quantity, valuation, ...rest } = req.body;
      const calculatedValuation = (valuation && parseFloat(valuation) > 0) 
        ? valuation 
        : (parseFloat(quantity) * 1000 * 50).toString();
      
      const receiptData = {
        ...rest,
        quantity,
        valuation: calculatedValuation,
        ownerId: req.session.userId,
        receiptNumber: `WR${Date.now()}-${req.session.userId}`,
        blockchainHash: `198324${Math.random().toString(16).substring(2, 18)}`,
        expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
        liens: JSON.stringify({
          verificationCode: `WR-${req.session.userId}-${Math.random().toString(16).substring(2, 11).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
          processId: rest.processId || 0,
          commodityName: rest.commodityName || "Unknown",
          qualityGrade: "Grade A",
          qualityParameters: {
            moisture: "0.0%",
            foreignMatter: "0.0%", 
            brokenGrains: "0.0%"
          }
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const receipt = await storage.createWarehouseReceipt(receiptData);
      
      console.log("Warehouse receipt created:", receipt.id);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating warehouse receipt:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to create warehouse receipt" });
    }
  });

  apiRouter.post("/processes", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Creating new deposit process:", req.body);
      
      const { 
        type,
        commodityName,
        commodityType,
        quantity,
        warehouseId,
        deliveryMethod,
        scheduledDate,
        scheduledTime,
        pickupAddress,
        estimatedValue 
      } = req.body;

      // Validate required fields
      if (!commodityName || !commodityType || !quantity || !warehouseId) {
        return res.status(400).json({ 
          message: "Missing required fields: commodityName, commodityType, quantity, warehouseId" 
        });
      }

      // First create the commodity record
      const commodity = await storage.createCommodity({
        name: commodityName,
        type: commodityType,
        quantity: quantity.toString(),
        measurementUnit: "MT",
        qualityParameters: {},
        gradeAssigned: "pending",
        warehouseId: parseInt(warehouseId),
        ownerId: req.session.userId,
        status: "active",
        channelType: "green",
        valuation: estimatedValue?.toString() || (parseFloat(quantity) * 1000 * 50).toString()
      });

      // Then create the process
      const processData = {
        processType: type || "deposit",
        userId: req.session.userId,
        commodityId: commodity.id,
        warehouseId: parseInt(warehouseId),
        status: "in_progress" as const,
        currentStage: "pickup_scheduled",
        progress: 10,
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        metadata: {
          deliveryMethod,
          scheduledDate,
          scheduledTime,
          pickupAddress,
          estimatedValue
        }
      };

      const process = await storage.createProcess(processData);
      
      console.log("Created process:", process.id);

      // Send commodity data to warehouse module for processing
      try {
        if (typeof globalThis.sendToWarehouseModule === 'function') {
          const warehouseData = {
            processId: process.id,
            commodity: {
              id: commodity.id,
              name: commodity.name,
              type: commodity.type,
              grade: commodity.grade,
              quantity: commodity.quantity,
              measurementUnit: commodity.measurementUnit
            },
            warehouse: {
              id: warehouse.id,
              name: warehouse.name,
              location: warehouse.location
            },
            owner: {
              id: req.session.userId
            },
            pickupSchedule: {
              date: pickupDate,
              time: pickupTime,
              address: pickupAddress
            },
            timestamp: new Date().toISOString()
          };
          
          await globalThis.sendToWarehouseModule(warehouseData);
          console.log(`Sent commodity ${commodity.id} to warehouse module for processing`);
        }
      } catch (error) {
        console.warn('Failed to send data to warehouse module:', error);
        // Don't fail the entire request if warehouse integration fails
      }

      // Request quality testing for the commodity
      try {
        if (typeof globalThis.requestQualityTesting === 'function') {
          const qualityData = {
            commodityId: commodity.id,
            processId: process.id,
            commodityType: commodity.type,
            expectedGrade: commodity.grade,
            quantity: commodity.quantity,
            harvestDate: commodity.harvestDate,
            storageConditions: commodity.storageConditions,
            timestamp: new Date().toISOString()
          };
          
          await globalThis.requestQualityTesting(qualityData);
          console.log(`Requested quality testing for commodity ${commodity.id}`);
        }
      } catch (error) {
        console.warn('Failed to request quality testing:', error);
        // Don't fail the entire request if quality integration fails
      }
      
      // AUTO-START TRACKING: Immediately start progression after process creation
      setTimeout(() => progressToNextStage(process.id), 15 * 60 * 1000); // 15 minutes
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(process);
    } catch (error) {
      console.error("Error creating process:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to create deposit process" });
    }
  });

  // Bypass demo routes for quality assessment and pricing when external services unavailable
  
  // Mock quality assessment results based on commodity type
  const generateMockQualityResults = (commodityType: string) => {
    const baseResults: Record<string, any> = {
      cereals: {
        moisture: 12.5,
        foreignMatter: 1.2,
        brokenGrains: 2.8,
        weeviled: 0.5,
        grade: 'A',
        score: 87
      },
      pulses: {
        moisture: 10.2,
        foreignMatter: 0.8,
        damaged: 1.5,
        weeviled: 0.3,
        grade: 'A',
        score: 89
      },
      oilseeds: {
        moisture: 8.5,
        foreignMatter: 1.1,
        oilContent: 42.3,
        freefattyAcid: 1.2,
        grade: 'A',
        score: 85
      },
      vegetables: {
        moisture: 85.2,
        freshness: 92,
        damage: 3.5,
        pesticide: 0.1,
        grade: 'A',
        score: 88
      }
    };
    
    return baseResults[commodityType.toLowerCase()] || baseResults.vegetables;
  };
  
  // Mock pricing calculation based on quality results
  const calculateMockPricing = (commodity: any, qualityResults: any) => {
    const baseRates: Record<string, number> = {
      cereals: 2500,
      pulses: 4500,
      oilseeds: 3200,
      vegetables: 1800,
      spices: 8500
    };
    
    const baseRate = baseRates[commodity.type.toLowerCase()] || 2000;
    const qualityMultiplier = qualityResults.score / 100;
    const marketRate = baseRate * qualityMultiplier;
    
    return {
      baseRate,
      qualityScore: qualityResults.score,
      qualityMultiplier: qualityMultiplier.toFixed(2),
      marketRate: Math.round(marketRate),
      totalValue: Math.round(marketRate * parseFloat(commodity.quantity)),
      currency: 'INR',
      pricePerUnit: 'MT'
    };
  };

  // Bypass route: Quality assessment (alias for complete-assessment)
  apiRouter.post("/bypass/quality-assessment/:processId", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const processId = parseInt(req.params.processId);
      const process = await storage.getProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }

      // Get commodity details
      const commodity = await storage.getCommodity(process.commodityId!);
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }

      // Generate mock quality assessment results
      const qualityResults = generateMockQualityResults(commodity.type);
      
      // Calculate mock pricing
      const pricingData = calculateMockPricing(commodity, qualityResults);
      
      // Update commodity with quality and pricing data
      await storage.updateCommodity(commodity.id, {
        qualityParameters: qualityResults,
        gradeAssigned: qualityResults.grade,
        valuation: pricingData.totalValue.toString(),
        status: "processing"
      });

      // Update process to final stages
      const updatedProcess = await storage.updateProcess(processId, {
        status: "in_progress" as const,
        currentStage: "ewr_generation",
        stageProgress: {
          pickup_scheduled: 'completed',
          arrived_at_warehouse: 'completed',
          weighing_complete: 'completed',
          moisture_analysis: 'completed',
          visual_ai_scan: 'completed',
          qa_assessment_complete: 'completed',
          pricing_calculated: 'completed',
          ewr_generation: 'in_progress'
        }
      });

      console.log(`Completed bypass assessment for process ${processId}`);
      
      res.setHeader('Content-Type', 'application/json');
      res.json({
        processId,
        status: 'completed',
        qualityAssessment: qualityResults,
        pricing: pricingData,
        process: updatedProcess,
        message: 'Quality assessment and pricing completed using bypass demo service'
      });

    } catch (error) {
      console.error("Error in bypass assessment:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to complete bypass assessment" });
    }
  });

  // Bypass route: Complete quality assessment and pricing flow (legacy alias)
  apiRouter.post("/bypass/complete-assessment/:processId", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const processId = parseInt(req.params.processId);
      const process = await storage.getProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }

      // Get commodity details
      const commodity = await storage.getCommodity(process.commodityId!);
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }

      // Generate mock quality assessment results
      const qualityResults = generateMockQualityResults(commodity.type);
      
      // Calculate mock pricing
      const pricingData = calculateMockPricing(commodity, qualityResults);
      
      // Update commodity with quality and pricing data
      await storage.updateCommodity(commodity.id, {
        qualityParameters: qualityResults,
        gradeAssigned: qualityResults.grade,
        valuation: pricingData.totalValue.toString(),
        status: "processing"
      });

      // Update process to final stages
      const updatedProcess = await storage.updateProcess(processId, {
        status: "in_progress" as const,
        currentStage: "ewr_generation",
        stageProgress: {
          pickup_scheduled: 'completed',
          arrived_at_warehouse: 'completed',
          weighing_complete: 'completed',
          moisture_analysis: 'completed',
          visual_ai_scan: 'completed',
          qa_assessment_complete: 'completed',
          pricing_calculated: 'completed',
          ewr_generation: 'in_progress'
        }
      });

      console.log(`Completed bypass assessment for process ${processId}`);
      
      res.setHeader('Content-Type', 'application/json');
      res.json({
        processId,
        status: 'completed',
        qualityAssessment: qualityResults,
        pricing: pricingData,
        process: updatedProcess,
        message: 'Quality assessment and pricing completed using bypass demo service'
      });

    } catch (error) {
      console.error("Error in bypass assessment:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to complete bypass assessment" });
    }
  });

  // Generate Electronic Warehouse Receipt (eWR)
  apiRouter.post("/bypass/generate-ewr/:processId", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const processId = parseInt(req.params.processId);
      const process = await storage.getProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }

      const commodity = await storage.getCommodity(process.commodityId!);
      const warehouse = await storage.getWarehouse(process.warehouseId!);
      
      if (!commodity || !warehouse) {
        return res.status(404).json({ message: "Commodity or warehouse not found" });
      }

      // Generate unique receipt number
      const receiptNumber = `eWR-${Date.now()}-${process.commodityId}`;
      
      // FIXED: Ensure proper valuation calculation (1 MT = 1000 kg × Rs 50/kg)
      const calculatedValuation = commodity.valuation && parseFloat(commodity.valuation) > 0 
        ? commodity.valuation 
        : (parseFloat(commodity.quantity) * 1000 * 50).toString();

      // Create warehouse receipt
      const receipt = await storage.createWarehouseReceipt({
        receiptNumber,
        commodityId: commodity.id,
        warehouseId: warehouse.id,
        ownerId: req.session.userId,
        quantity: commodity.quantity,
        measurementUnit: commodity.measurementUnit,
        status: "active",
        blockchainHash: `0x${Math.random().toString(16).substring(2, 18)}`,
        valuation: calculatedValuation,
        warehouseName: warehouse.name,
        metadata: JSON.stringify({
          type: 'quality_certificate',
          url: `/documents/quality_cert_${receiptNumber}.pdf`,
          timestamp: new Date().toISOString(),
          storageLocation: `${warehouse.name}-${Math.floor(Math.random() * 100)}`,
          insuranceCoverage: (parseFloat(commodity.valuation || (parseFloat(commodity.quantity) * 1000 * 50).toString()) * 0.8).toString()
        })
      });

      // Complete the process
      await storage.updateProcess(processId, {
        status: "completed" as const,
        currentStage: "ewr_generated",
        stageProgress: {
          pickup_scheduled: 'completed',
          arrived_at_warehouse: 'completed',
          weighing_complete: 'completed',
          moisture_analysis: 'completed',
          visual_ai_scan: 'completed',
          qa_assessment_complete: 'completed',
          pricing_calculated: 'completed',
          ewr_generation: 'completed'
        }
      });

      console.log(`Generated eWR ${receiptNumber} for process ${processId}`);

      res.setHeader('Content-Type', 'application/json');
      res.json({
        receipt,
        process: await storage.getProcess(processId),
        message: 'Electronic Warehouse Receipt generated successfully'
      });

    } catch (error) {
      console.error("Error generating eWR:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to generate electronic warehouse receipt" });
    }
  });

  // Webhook authentication middleware
  const authenticateWebhook = (req: Request, res: Response, next: Function) => {
    const apiKey = req.headers['x-api-key'];
    const expectedKeys = (process.env.WEBHOOK_API_KEYS || 'warehouse-key-123,quality-key-456').split(',');
    
    if (!apiKey || !expectedKeys.includes(apiKey as string)) {
      return res.status(401).json({ message: 'Invalid or missing API key' });
    }
    
    // Verify request signature if present
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (signature && timestamp) {
      const payload = JSON.stringify(req.body) + timestamp;
      const secret = process.env.WEBHOOK_SECRET || 'tradewiser-webhook-secret';
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      
      if (signature !== expectedSignature) {
        return res.status(401).json({ message: 'Invalid request signature' });
      }
    }
    
    next();
  };

  // Outbound API functions
  const sendToWarehouseModule = async (data: any) => {
    try {
      const warehouseApiUrl = process.env.WAREHOUSE_MODULE_URL || 'http://localhost:3001';
      const apiKey = process.env.WAREHOUSE_MODULE_API_KEY || 'warehouse-api-key';
      
      const response = await fetch(`${warehouseApiUrl}/api/process-commodity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'TradeWiser-Platform/1.0'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Warehouse module responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Sent to warehouse module:', result);
      return result;
    } catch (error) {
      console.error('Failed to send to warehouse module:', error);
      throw error;
    }
  };

  const requestQualityTesting = async (commodityData: any) => {
    try {
      const qualityApiUrl = process.env.QUALITY_MODULE_URL || 'http://localhost:3002';
      const apiKey = process.env.QUALITY_MODULE_API_KEY || 'quality-api-key';
      
      const response = await fetch(`${qualityApiUrl}/api/analyze-quality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'TradeWiser-Platform/1.0'
        },
        body: JSON.stringify(commodityData)
      });
      
      if (!response.ok) {
        throw new Error(`Quality module responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Quality testing requested:', result);
      return result;
    } catch (error) {
      console.error('Failed to request quality testing:', error);
      throw error;
    }
  };

  // WEBHOOK ENDPOINTS

  // Webhook: Warehouse Status Updates
  apiRouter.post("/webhooks/warehouse/status-update", webhookRateLimiter, authenticateWebhook, async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { processId, status, stage, metadata, timestamp } = req.body;
      
      if (!processId || !status) {
        return res.status(400).json({ message: 'processId and status are required' });
      }

      // Update process status
      const process = await storage.getProcess(processId);
      if (!process) {
        return res.status(404).json({ message: 'Process not found' });
      }

      // Update process with new status and stage information
      const updatedProcess = await storage.updateProcess(processId, {
        currentStage: stage || process.currentStage,
        stageProgress: {
          ...process.stageProgress,
          [stage]: status
        },
        metadata: JSON.stringify({
          ...JSON.parse(process.metadata || '{}'),
          ...metadata,
          lastWarehouseUpdate: timestamp || new Date().toISOString()
        })
      });

      // Broadcast WebSocket update to subscribed clients
      if (typeof globalThis.broadcastEntityUpdate === 'function') {
        globalThis.broadcastEntityUpdate(
          process.ownerId!,
          'process', 
          processId,
          {
            type: 'status_update',
            processId,
            status,
            stage,
            metadata,
            timestamp: timestamp || new Date().toISOString()
          }
        );
      }

      console.log(`Warehouse status update for process ${processId}: ${stage} -> ${status}`);
      
      const responseTime = Date.now() - startTime;
      monitoringService.recordWebhookRequest('/api/webhooks/warehouse/status-update', true, responseTime);

      res.json({
        success: true,
        processId,
        status,
        stage,
        message: 'Status updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook error - warehouse status update:', error);
      const responseTime = Date.now() - startTime;
      monitoringService.recordWebhookRequest('/api/webhooks/warehouse/status-update', false, responseTime, 
        error instanceof Error ? error.message : String(error), 'business', 500);
      res.status(500).json({ message: 'Failed to process warehouse status update' });
    }
  });

  // Webhook: IoT Weight & Quality Data
  apiRouter.post("/webhooks/warehouse/weight-update", authenticateWebhook, async (req: Request, res: Response) => {
    try {
      const { processId, commodityId, actualWeight, measurementUnit, qualityGrade, moistureContent, timestamp } = req.body;
      
      if (!processId && !commodityId) {
        return res.status(400).json({ message: 'processId or commodityId is required' });
      }

      let commodity, process;

      // Get process and commodity data
      if (processId) {
        process = await storage.getProcess(processId);
        if (process) {
          commodity = await storage.getCommodity(process.commodityId!);
        }
      } else {
        commodity = await storage.getCommodity(commodityId);
      }

      if (!commodity) {
        return res.status(404).json({ message: 'Commodity not found' });
      }

      // Update commodity with actual weight and quality data
      const updatedCommodity = await storage.updateCommodity(commodity.id, {
        quantity: actualWeight || commodity.quantity,
        measurementUnit: measurementUnit || commodity.measurementUnit,
        quality: qualityGrade || commodity.quality,
        metadata: JSON.stringify({
          ...JSON.parse(commodity.metadata || '{}'),
          actualWeight,
          moistureContent,
          qualityGrade,
          iotUpdate: timestamp || new Date().toISOString()
        })
      });

      // Recalculate valuation based on actual weight
      const newValuation = actualWeight ? 
        (parseFloat(actualWeight) * 1000 * 50).toString() : 
        commodity.valuation;

      if (actualWeight && newValuation !== commodity.valuation) {
        await storage.updateCommodity(commodity.id, { 
          valuation: newValuation
        });
      }

      // Check if quality assessment is complete and trigger receipt generation
      if (qualityGrade && actualWeight && process) {
        // Update process to indicate weight and quality are complete
        await storage.updateProcess(process.id, {
          currentStage: "pricing_calculated",
          stageProgress: {
            ...process.stageProgress,
            weighing_complete: 'completed',
            qa_assessment_complete: 'completed',
            pricing_calculated: 'completed'
          }
        });

        // Auto-generate warehouse receipt if conditions are met
        if (qualityGrade === 'Premium' || qualityGrade === 'A' || qualityGrade === 'Good') {
          const warehouse = await storage.getWarehouse(process.warehouseId!);
          const receiptNumber = `WR${Date.now()}-${commodity.id}`;
          
          const receipt = await storage.createWarehouseReceipt({
            receiptNumber,
            commodityId: commodity.id,
            warehouseId: warehouse?.id || 1,
            ownerId: commodity.ownerId,
            quantity: actualWeight || commodity.quantity,
            measurementUnit: measurementUnit || commodity.measurementUnit,
            status: "active",
            blockchainHash: `0x${crypto.randomBytes(8).toString('hex')}`,
            valuation: newValuation || commodity.valuation,
            warehouseName: warehouse?.name || 'IoT Warehouse',
            metadata: JSON.stringify({
              type: 'iot_generated',
              actualWeight,
              qualityGrade,
              moistureContent,
              autoGenerated: true,
              timestamp: timestamp || new Date().toISOString()
            })
          });

          console.log(`Auto-generated warehouse receipt ${receiptNumber} for commodity ${commodity.id}`);
        }
      }

      // Broadcast WebSocket update
      if (typeof globalThis.broadcastEntityUpdate === 'function') {
        globalThis.broadcastEntityUpdate(
          commodity.ownerId,
          'commodity',
          commodity.id,
          {
            type: 'weight_quality_update',
            commodityId: commodity.id,
            actualWeight,
            qualityGrade,
            moistureContent,
            newValuation,
            timestamp: timestamp || new Date().toISOString()
          }
        );

        if (process) {
          globalThis.broadcastEntityUpdate(
            process.ownerId!,
            'process',
            process.id,
            {
              type: 'iot_update',
              processId: process.id,
              actualWeight,
              qualityGrade,
              timestamp: timestamp || new Date().toISOString()
            }
          );
        }
      }

      console.log(`IoT weight/quality update for commodity ${commodity.id}: ${actualWeight}${measurementUnit}, grade: ${qualityGrade}`);

      res.json({
        success: true,
        commodityId: commodity.id,
        processId: process?.id,
        actualWeight,
        qualityGrade,
        newValuation,
        receiptGenerated: qualityGrade && actualWeight && process,
        message: 'Weight and quality data updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook error - weight/quality update:', error);
      res.status(500).json({ message: 'Failed to process weight/quality update' });
    }
  });

  // Webhook: Quality Testing Results
  apiRouter.post("/webhooks/quality/results", authenticateWebhook, async (req: Request, res: Response) => {
    try {
      const { 
        commodityId, 
        processId, 
        qualityScore, 
        grade, 
        parameters, 
        defects, 
        recommendations,
        certificationUrl,
        timestamp 
      } = req.body;
      
      if (!commodityId && !processId) {
        return res.status(400).json({ message: 'commodityId or processId is required' });
      }

      let commodity, process;

      // Get commodity and process data
      if (processId) {
        process = await storage.getProcess(processId);
        if (process) {
          commodity = await storage.getCommodity(process.commodityId!);
        }
      } else {
        commodity = await storage.getCommodity(commodityId);
      }

      if (!commodity) {
        return res.status(404).json({ message: 'Commodity not found' });
      }

      // Update commodity with quality assessment results
      const updatedCommodity = await storage.updateCommodity(commodity.id, {
        quality: grade || commodity.quality,
        metadata: JSON.stringify({
          ...JSON.parse(commodity.metadata || '{}'),
          qualityAssessment: {
            score: qualityScore,
            grade,
            parameters,
            defects,
            recommendations,
            certificationUrl,
            timestamp: timestamp || new Date().toISOString()
          }
        })
      });

      // Recalculate market valuation based on quality grade
      let qualityMultiplier = 1.0;
      switch (grade?.toLowerCase()) {
        case 'premium': qualityMultiplier = 1.3; break;
        case 'a': case 'good': qualityMultiplier = 1.1; break;
        case 'b': case 'fair': qualityMultiplier = 0.9; break;
        case 'c': case 'poor': qualityMultiplier = 0.7; break;
        default: qualityMultiplier = 1.0;
      }

      const baseValuation = parseFloat(commodity.quantity) * 1000 * 50;
      const newValuation = (baseValuation * qualityMultiplier).toString();

      await storage.updateCommodity(commodity.id, { 
        valuation: newValuation
      });

      // Update process if exists
      if (process) {
        await storage.updateProcess(process.id, {
          currentStage: "qa_assessment_complete",
          stageProgress: {
            ...process.stageProgress,
            visual_ai_scan: 'completed',
            qa_assessment_complete: 'completed'
          },
          metadata: JSON.stringify({
            ...JSON.parse(process.metadata || '{}'),
            qualityResults: {
              score: qualityScore,
              grade,
              parameters,
              defects,
              recommendations,
              timestamp: timestamp || new Date().toISOString()
            }
          })
        });
      }

      // Auto-generate receipt for high-quality commodities
      let receipt = null;
      if (qualityScore >= 80 || ['premium', 'a', 'good'].includes(grade?.toLowerCase())) {
        const warehouse = process ? await storage.getWarehouse(process.warehouseId!) : null;
        const receiptNumber = `QC${Date.now()}-${commodity.id}`;
        
        receipt = await storage.createWarehouseReceipt({
          receiptNumber,
          commodityId: commodity.id,
          warehouseId: warehouse?.id || 1,
          ownerId: commodity.ownerId,
          quantity: commodity.quantity,
          measurementUnit: commodity.measurementUnit,
          status: "active",
          blockchainHash: `0x${crypto.randomBytes(8).toString('hex')}`,
          valuation: newValuation,
          warehouseName: warehouse?.name || 'Quality Certified Warehouse',
          metadata: JSON.stringify({
            type: 'quality_certified',
            qualityScore,
            grade,
            certificationUrl,
            autoGenerated: true,
            timestamp: timestamp || new Date().toISOString()
          })
        });

        console.log(`Auto-generated quality-certified receipt ${receiptNumber} for commodity ${commodity.id}`);
      }

      // Broadcast WebSocket update
      if (typeof globalThis.broadcastEntityUpdate === 'function') {
        globalThis.broadcastEntityUpdate(
          commodity.ownerId,
          'commodity',
          commodity.id,
          {
            type: 'quality_results',
            commodityId: commodity.id,
            qualityScore,
            grade,
            newValuation,
            receiptGenerated: !!receipt,
            timestamp: timestamp || new Date().toISOString()
          }
        );

        if (process) {
          globalThis.broadcastEntityUpdate(
            process.ownerId!,
            'process',
            process.id,
            {
              type: 'quality_complete',
              processId: process.id,
              qualityScore,
              grade,
              timestamp: timestamp || new Date().toISOString()
            }
          );
        }
      }

      console.log(`Quality assessment completed for commodity ${commodity.id}: ${grade} (${qualityScore}/100)`);

      res.json({
        success: true,
        commodityId: commodity.id,
        processId: process?.id,
        qualityScore,
        grade,
        newValuation,
        receiptNumber: receipt?.receiptNumber,
        message: 'Quality assessment results processed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook error - quality results:', error);
      res.status(500).json({ message: 'Failed to process quality results' });
    }
  });

  // ADMIN ENDPOINTS

  // Admin: System Health Dashboard
  apiRouter.get("/admin/system-health", requireAuth, async (req: Request, res: Response) => {
    try {
      const health = monitoringService.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Failed to get system health:', error);
      res.status(500).json({ message: 'Failed to retrieve system health' });
    }
  });

  // Admin: Error Logs
  apiRouter.get("/admin/error-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const endpoint = req.query.endpoint as string;
      
      const errors = monitoringService.getRecentErrors(limit, endpoint);
      res.json(errors);
    } catch (error) {
      console.error('Failed to get error logs:', error);
      res.status(500).json({ message: 'Failed to retrieve error logs' });
    }
  });

  // Admin: Integration Metrics Export
  apiRouter.get("/admin/metrics/export", requireAuth, async (req: Request, res: Response) => {
    try {
      const metrics = monitoringService.exportMetrics();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="integration-metrics-${Date.now()}.json"`);
      res.json(metrics);
    } catch (error) {
      console.error('Failed to export metrics:', error);
      res.status(500).json({ message: 'Failed to export metrics' });
    }
  });

  // Admin: Force Health Check
  apiRouter.post("/admin/health-check/:module", requireAuth, async (req: Request, res: Response) => {
    try {
      const module = req.params.module;
      const isHealthy = await monitoringService.performHealthCheck(module);
      
      res.json({
        module,
        isHealthy,
        timestamp: new Date().toISOString(),
        message: isHealthy ? 'Health check passed' : 'Health check failed'
      });
    } catch (error) {
      console.error(`Health check failed for ${req.params.module}:`, error);
      res.status(500).json({ message: 'Health check failed' });
    }
  });

  // API Documentation Endpoint (OpenAPI Specification)
  apiRouter.get("/docs/openapi.json", (req: Request, res: Response) => {
    const openApiSpec = {
      openapi: "3.0.3",
      info: {
        title: "TradeWiser Webhook Integration API",
        description: "Comprehensive webhook system for external warehouse and quality testing module integration",
        version: "1.0.0",
        contact: {
          name: "TradeWiser Platform",
          email: "integrations@tradewiser.com"
        }
      },
      servers: [
        {
          url: `${req.protocol}://${req.get('host')}/api`,
          description: "Production server"
        }
      ],
      paths: {
        "/webhooks/warehouse/status-update": {
          post: {
            summary: "Warehouse Status Update",
            description: "Receive real-time status updates from warehouse management module",
            tags: ["Webhooks"],
            security: [{ ApiKeyAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["processId", "status"],
                    properties: {
                      processId: { type: "integer", description: "Process ID being updated" },
                      status: { type: "string", enum: ["pending", "in_progress", "completed", "failed"] },
                      stage: { type: "string", description: "Current workflow stage" },
                      metadata: { type: "object", description: "Additional status metadata" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: "Status updated successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        processId: { type: "integer" },
                        status: { type: "string" },
                        stage: { type: "string" },
                        message: { type: "string" },
                        timestamp: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              },
              401: { description: "Invalid or missing API key" },
              404: { description: "Process not found" },
              500: { description: "Internal server error" }
            }
          }
        },
        "/webhooks/warehouse/weight-update": {
          post: {
            summary: "IoT Weight & Quality Data",
            description: "Receive IoT weighbridge data and quality assessment results",
            tags: ["Webhooks"],
            security: [{ ApiKeyAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      processId: { type: "integer", description: "Process ID (optional if commodityId provided)" },
                      commodityId: { type: "integer", description: "Commodity ID (optional if processId provided)" },
                      actualWeight: { type: "string", description: "Actual weight measurement" },
                      measurementUnit: { type: "string", enum: ["kg", "MT", "ton"] },
                      qualityGrade: { type: "string", enum: ["Premium", "A", "Good", "B", "Fair", "C", "Poor"] },
                      moistureContent: { type: "number", description: "Moisture percentage" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: "Weight and quality data updated successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        commodityId: { type: "integer" },
                        processId: { type: "integer" },
                        actualWeight: { type: "string" },
                        qualityGrade: { type: "string" },
                        newValuation: { type: "string" },
                        receiptGenerated: { type: "boolean" },
                        message: { type: "string" },
                        timestamp: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/webhooks/quality/results": {
          post: {
            summary: "Quality Testing Results",
            description: "Receive AI-powered quality assessment results",
            tags: ["Webhooks"],
            security: [{ ApiKeyAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      commodityId: { type: "integer", description: "Commodity ID (optional if processId provided)" },
                      processId: { type: "integer", description: "Process ID (optional if commodityId provided)" },
                      qualityScore: { type: "integer", minimum: 0, maximum: 100 },
                      grade: { type: "string", enum: ["Premium", "A", "B", "C"] },
                      parameters: { type: "object", description: "Quality assessment parameters" },
                      defects: { type: "array", items: { type: "string" } },
                      recommendations: { type: "array", items: { type: "string" } },
                      certificationUrl: { type: "string", format: "uri" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: "Quality assessment results processed successfully",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        commodityId: { type: "integer" },
                        processId: { type: "integer" },
                        qualityScore: { type: "integer" },
                        grade: { type: "string" },
                        newValuation: { type: "string" },
                        receiptNumber: { type: "string" },
                        message: { type: "string" },
                        timestamp: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
            description: "API key for webhook authentication"
          }
        }
      },
      tags: [
        {
          name: "Webhooks",
          description: "Webhook endpoints for external system integration"
        }
      ]
    };

    res.json(openApiSpec);
  });

  // NEW LOAN-RECEIPT CONNECTION ENDPOINTS

  // Get eligible receipts for loan collateral
  apiRouter.get("/loans/eligible-collateral", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      // Get all active receipts for the user that aren't already collateralized
      const userReceipts = await storage.listWarehouseReceiptsByOwner(userId);
      const eligibleReceipts = userReceipts.filter(receipt => 
        receipt.status === 'active' && 
        !receipt.liens && // No existing liens
        receipt.valuation && 
        parseFloat(receipt.valuation) > 0
      );
      
      // Calculate loan eligibility for each receipt
      const eligibleCollateral = await Promise.all(eligibleReceipts.map(async (receipt) => {
        const receiptValue = parseFloat(receipt.valuation || '0');
        const maxLoanAmount = Math.floor(receiptValue * 0.8); // 80% collateral ratio
        const warehouse = await storage.getWarehouse(receipt.warehouseId!);
        const commodity = receipt.commodityId ? await storage.getCommodity(receipt.commodityId) : null;
        
        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          commodityName: commodity?.name || receipt.commodityName || 'Unknown Commodity',
          commodityType: commodity?.type || 'Unknown Type',
          quantity: receipt.quantity,
          measurementUnit: receipt.measurementUnit || commodity?.measurementUnit || 'MT',
          warehouseName: warehouse?.name || receipt.warehouseName || 'Unknown Warehouse',
          receiptValue: receiptValue,
          maxLoanAmount: maxLoanAmount,
          collateralRatio: 80,
          issuedDate: receipt.issuedDate,
          expiryDate: receipt.expiryDate,
          status: receipt.status,
          qualityGrade: receipt.qualityGrade || commodity?.gradeAssigned || 'Standard',
          blockchainVerified: !!receipt.blockchainHash
        };
      }));
      
      // Sort by receipt value descending (most valuable first)
      eligibleCollateral.sort((a, b) => b.receiptValue - a.receiptValue);
      
      res.json({
        eligibleCollateral,
        totalEligibleValue: eligibleCollateral.reduce((sum, item) => sum + item.receiptValue, 0),
        totalMaxLoanAmount: eligibleCollateral.reduce((sum, item) => sum + item.maxLoanAmount, 0),
        count: eligibleCollateral.length
      });
    } catch (error) {
      console.error('Failed to fetch eligible collateral:', error);
      res.status(500).json({ message: 'Failed to fetch eligible collateral' });
    }
  });

  // Calculate loan offer for specific receipts
  apiRouter.post("/loans/calculate-offer", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const { receiptIds, requestedAmount } = req.body;
      
      if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
        return res.status(400).json({ message: 'Receipt IDs are required' });
      }
      
      // Fetch and validate receipts
      const receipts = await Promise.all(
        receiptIds.map(id => storage.getWarehouseReceipt(id))
      );
      
      // Check all receipts exist and belong to user
      const validReceipts = receipts.filter((receipt): receipt is NonNullable<typeof receipt> => 
        receipt !== undefined &&
        receipt !== null && 
        receipt.ownerId === userId && 
        receipt.status === 'active' && 
        !receipt.liens
      );
      
      if (validReceipts.length !== receiptIds.length) {
        return res.status(400).json({ message: 'Some receipts are invalid or not eligible' });
      }
      
      // Calculate total collateral value
      const totalCollateralValue = validReceipts.reduce((sum, receipt) => {
        return sum + parseFloat(receipt.valuation || '0');
      }, 0);
      
      const maxLoanAmount = Math.floor(totalCollateralValue * 0.8); // 80% ratio
      const finalLoanAmount = requestedAmount ? 
        Math.min(requestedAmount, maxLoanAmount) : 
        maxLoanAmount;
      
      // Calculate loan terms
      const interestRate = 12; // 12% annual rate (can be dynamic based on risk)
      const defaultTenureMonths = 12;
      const monthlyPayment = Math.ceil((finalLoanAmount * (1 + (interestRate / 100))) / defaultTenureMonths);
      const totalPayment = monthlyPayment * defaultTenureMonths;
      const totalInterest = totalPayment - finalLoanAmount;
      
      res.json({
        eligible: finalLoanAmount > 0,
        collateralReceiptIds: receiptIds,
        totalCollateralValue,
        maxLoanAmount,
        requestedAmount: requestedAmount || maxLoanAmount,
        approvedAmount: finalLoanAmount,
        collateralRatio: 80,
        interestRate,
        tenureMonths: defaultTenureMonths,
        monthlyPayment,
        totalPayment,
        totalInterest,
        receipts: validReceipts.map(receipt => ({
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          value: parseFloat(receipt.valuation || '0'),
          commodityName: receipt.commodityName,
          quantity: receipt.quantity
        }))
      });
    } catch (error) {
      console.error('Failed to calculate loan offer:', error);
      res.status(500).json({ message: 'Failed to calculate loan offer' });
    }
  });

  // Apply for loan using specific receipts
  apiRouter.post("/loans/apply-with-collateral", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const { 
        receiptIds, 
        requestedAmount, 
        tenureMonths = 12, 
        purpose = 'Working Capital',
        lendingPartnerName = 'TradeWiser Direct Lending'
      } = req.body;
      
      if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
        return res.status(400).json({ message: 'Receipt IDs are required' });
      }
      
      if (!requestedAmount || requestedAmount <= 0) {
        return res.status(400).json({ message: 'Valid requested amount is required' });
      }
      
      // Get loan calculation first
      const offerResponse = await fetch(`http://localhost:5000/api/loans/calculate-offer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || ''
        },
        body: JSON.stringify({ receiptIds, requestedAmount })
      });
      
      if (!offerResponse.ok) {
        return res.status(400).json({ message: 'Unable to calculate loan offer' });
      }
      
      const offer = await offerResponse.json();
      
      if (!offer.eligible || offer.approvedAmount <= 0) {
        return res.status(400).json({ message: 'Loan not eligible based on collateral' });
      }
      
      // Create the loan
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + tenureMonths);
      
      const newLoan = await storage.createLoan({
        userId,
        lendingPartnerId: 1, // Default lending partner
        lendingPartnerName,
        amount: offer.approvedAmount.toString(),
        interestRate: offer.interestRate.toString(),
        endDate,
        status: 'pending_approval',
        collateralReceiptIds: JSON.stringify(receiptIds),
        outstandingAmount: offer.approvedAmount.toString(),
        purpose,
        creditScore: 750 // Default credit score
      });
      
      // Update receipts to mark them as collateralized
      await Promise.all(receiptIds.map(async (receiptId: number) => {
        await storage.updateWarehouseReceipt(receiptId, {
          status: 'collateralized',
          liens: JSON.stringify([{
            type: 'loan_collateral',
            loanId: newLoan.id,
            amount: offer.approvedAmount,
            date: new Date().toISOString()
          }])
        });
      }));
      
      // Auto-approve for demo purposes (in production, this would go through underwriting)
      const approvedLoan = await storage.updateLoan(newLoan.id, {
        status: 'approved',
        outstandingAmount: offer.approvedAmount.toString()
      });
      
      res.json({
        success: true,
        loan: approvedLoan,
        message: 'Loan application submitted successfully',
        loanId: newLoan.id,
        approvedAmount: offer.approvedAmount,
        monthlyPayment: offer.monthlyPayment,
        totalPayment: offer.totalPayment,
        interestRate: offer.interestRate,
        tenure: tenureMonths,
        collateralReceipts: receiptIds.length
      });
      
    } catch (error) {
      console.error('Failed to apply for loan:', error);
      res.status(500).json({ message: 'Failed to process loan application' });
    }
  });

  // AUTO-START TRACKING ENDPOINT
  apiRouter.post("/deposits/:id/start-tracking", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session!.userId as number;

      // Get the process
      const process = await storage.getProcess(parseInt(id));
      if (!process || process.userId !== userId) {
        return res.status(404).json({ message: "Process not found or access denied" });
      }

      // Update process to start tracking with estimated completion
      const updatedProcess = await storage.updateProcess(parseInt(id), {
        currentStage: "pickup_scheduled",
        stageProgress: {
          startedAt: new Date(),
          estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
        }
      });

      // Trigger automatic progression
      setTimeout(() => progressToNextStage(parseInt(id)), 15 * 60 * 1000); // 15 minutes

      res.json({ success: true, data: updatedProcess });
    } catch (error) {
      console.error('Error starting tracking:', error);
      res.status(500).json({ message: "Failed to start tracking" });
    }
  });

  // AUTO-PROGRESSION FUNCTIONS
  async function progressToNextStage(processId: number) {
    try {
      const process = await storage.getProcess(processId);
      if (!process) return;

      const stageProgression: Record<string, string> = {
        'pickup_scheduled': 'in_transit',
        'in_transit': 'arrived_warehouse',
        'arrived_warehouse': 'quality_check',
        'quality_check': 'receipt_generated'
      };

      const nextStage = stageProgression[process.currentStage || 'pickup_scheduled'];

      if (nextStage) {
        const currentProgress = JSON.parse(process.stageProgress as string || '{}');
        await storage.updateProcess(processId, {
          currentStage: nextStage,
          stageProgress: JSON.stringify({
            ...currentProgress,
            [`${nextStage}_at`]: new Date()
          })
        });

        console.log(`Process ${processId} progressed to ${nextStage}`);

        // Continue progression if not final stage
        if (nextStage !== 'receipt_generated') {
          const delay = getStageDelay(nextStage);
          setTimeout(() => progressToNextStage(processId), delay);
        } else {
          // Generate receipt when process complete
          await generateWarehouseReceipt(process.commodityId!);
        }
      }
    } catch (error) {
      console.error(`Error progressing process ${processId}:`, error);
    }
  }

  function getStageDelay(stage: string): number {
    const delays: Record<string, number> = {
      'in_transit': 30 * 60 * 1000,        // 30 minutes
      'arrived_warehouse': 45 * 60 * 1000, // 45 minutes
      'quality_check': 90 * 60 * 1000,     // 90 minutes
      'receipt_generated': 15 * 60 * 1000  // 15 minutes
    };
    return delays[stage] || 30 * 60 * 1000;
  }

  async function generateWarehouseReceipt(commodityId: number) {
    try {
      const commodity = await storage.getCommodity(commodityId);
      if (!commodity) return;

      const receiptNumber = `WR${Date.now()}-${commodityId}`;
      
      const receiptData = {
        receiptNumber,
        commodityId: commodity.id,
        warehouseId: commodity.warehouseId!,
        ownerId: commodity.ownerId!,
        quantity: commodity.quantity,
        measurementUnit: commodity.measurementUnit || "MT",
        status: "active" as const,
        blockchainHash: `0x${Math.random().toString(16).substring(2, 18)}`,
        valuation: commodity.valuation || (parseFloat(commodity.quantity) * 1000 * 50).toString(),
        commodityName: commodity.name,
        qualityGrade: commodity.gradeAssigned || "Standard",
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        metadata: JSON.stringify({
          type: 'auto_generated',
          processCompleted: true,
          autoGenerated: true,
          timestamp: new Date().toISOString()
        })
      };

      await storage.createWarehouseReceipt(receiptData);
      console.log(`Auto-generated warehouse receipt ${receiptNumber} for commodity ${commodityId}`);
    } catch (error) {
      console.error('Error generating warehouse receipt:', error);
    }
  }

  // Get deposit progress endpoint for tracking
  apiRouter.get("/deposits/:id/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session!.userId as number;

      const process = await storage.getProcess(parseInt(id));
      if (!process || process.userId !== userId) {
        return res.status(404).json({ message: "Process not found or access denied" });
      }

      const stageMessages: Record<string, string> = {
        'pickup_scheduled': 'Pickup has been scheduled and vehicle assigned',
        'in_transit': 'Vehicle is on route to warehouse facility',
        'arrived_warehouse': 'Commodity has arrived at warehouse for processing',
        'quality_check': 'Quality assessment and grading in progress',
        'receipt_generated': 'Electronic warehouse receipt has been generated'
      };

      const estimatedCompletionTimes: Record<string, number> = {
        'pickup_scheduled': 45 * 60 * 1000, // 45 minutes
        'in_transit': 75 * 60 * 1000,       // 75 minutes
        'arrived_warehouse': 120 * 60 * 1000, // 2 hours
        'quality_check': 210 * 60 * 1000,   // 3.5 hours
        'receipt_generated': 0               // Complete
      };

      const currentStage = process.currentStage || 'pickup_scheduled';
      const estimatedCompletion = process.stageProgress ? 
        JSON.parse(process.stageProgress as string).startedAt : new Date();

      res.json({
        id: process.id,
        currentStage,
        statusMessage: stageMessages[currentStage] || 'Processing your deposit',
        estimatedCompletion: new Date(new Date(estimatedCompletion).getTime() + estimatedCompletionTimes[currentStage]),
        progress: {
          pickup_scheduled: currentStage !== 'pickup_scheduled' ? 'completed' : 'current',
          in_transit: ['in_transit', 'arrived_warehouse', 'quality_check', 'receipt_generated'].includes(currentStage) ? 
            (currentStage === 'in_transit' ? 'current' : 'completed') : 'pending',
          arrived_warehouse: ['arrived_warehouse', 'quality_check', 'receipt_generated'].includes(currentStage) ? 
            (currentStage === 'arrived_warehouse' ? 'current' : 'completed') : 'pending',
          quality_check: ['quality_check', 'receipt_generated'].includes(currentStage) ? 
            (currentStage === 'quality_check' ? 'current' : 'completed') : 'pending',
          receipt_generated: currentStage === 'receipt_generated' ? 'completed' : 'pending'
        }
      });
    } catch (error) {
      console.error('Error fetching deposit progress:', error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // ===============================
  // REBUILD: CORE WORKING APIS
  // ===============================

  // Helper function for commodity pricing
  function getCommodityBasePrice(commodity: string): number {
    const prices: Record<string, number> = {
      'Wheat': 2500,
      'Rice': 3000,
      'Maize': 2000,
      'Soybean': 4500,
      'Cotton': 6000,
      'Sugarcane': 300,
      'Bajra': 2200,
      'Jowar': 2100,
      'Groundnut': 5500,
      'Mustard': 4800,
      'Barley': 2300,
      'Gram': 4200,
      'Tur': 6500,
      'Moong': 7000,
      'Urad': 6800
    };
    return prices[commodity] || 2500; // Default price per MT
  }

  // WORKING DEPOSIT API - IMMEDIATELY CREATES RECEIPT
  apiRouter.post('/deposits', requireAuth, async (req: Request, res: Response) => {
    try {
      const { commodityName, commodityType, quantity, unit, qualityParams, location } = req.body;
      const userId = req.session!.userId as number;

      if (!commodityName || !commodityType || !quantity) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: commodityName, commodityType, quantity"
        });
      }

      // Calculate market value (mock pricing for now)
      const basePrice = getCommodityBasePrice(commodityName);
      const marketValue = basePrice * parseFloat(quantity);

      // Create commodity entry
      const commodity = await storage.createCommodity({
        name: commodityName,
        type: commodityType,
        quantity: quantity.toString(),
        measurementUnit: unit || 'MT',
        qualityParameters: qualityParams || {},
        gradeAssigned: 'Pending Assessment',
        warehouseId: 1, // Default warehouse
        ownerId: userId,
        status: 'active',
        channelType: 'green',
        valuation: marketValue.toString(),
        marketValue: marketValue.toString()
      });

      console.log("Commodity created:", commodity.id);

      // IMMEDIATELY create warehouse receipt (no complex tracking for now)
      const receiptNumber = `TW${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const receipt = await storage.createWarehouseReceipt({
        receiptNumber,
        commodityId: commodity.id,
        ownerId: userId,
        warehouseId: 1,
        quantity: parseFloat(quantity).toString(),
        valuation: marketValue.toString(),
        status: 'active',
        availableForCollateral: true,
        collateralUsed: '0',
        blockchainHash: `BC-${Date.now()}`,
        qualityGrade: 'Grade A', // Mock quality for demo
        commodityName: commodityName,
        measurementUnit: unit || 'MT',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      });

      res.json({
        success: true,
        data: {
          commodity: commodity,
          receipt: receipt,
          message: `Commodity deposited and receipt ${receiptNumber} generated successfully!`
        }
      });
    } catch (error: any) {
      console.error('Deposit error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PORTFOLIO API - FIXED VERSION WITH PROPER ERROR HANDLING
  apiRouter.get('/portfolio', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;

      // Get receipts with commodity data
      const receipts = await storage.listWarehouseReceiptsByOwner(userId);
      const commodities = await storage.listCommoditiesByOwner(userId);

      // Calculate portfolio metrics
      const totalValue = receipts.reduce((sum, receipt) =>
        sum + (parseFloat(receipt.valuation || '0')), 0);

      const totalCollateralUsed = receipts.reduce((sum, receipt) =>
        sum + (parseFloat(receipt.collateralUsed || '0')), 0);

      const availableCredit = Math.max(0, (totalValue * 0.8) - totalCollateralUsed);

      res.json({
        success: true,
        data: {
          totalValue,
          receiptsCount: receipts.length,
          availableCredit,
          receipts,
          commodities: receipts
        }
      });
    } catch (error: any) {
      console.error('Portfolio API error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        data: {
          totalValue: 0,
          receiptsCount: 0,
          availableCredit: 0,
          receipts: [],
          commodities: []
        }
      });
    }
  });

  // ELIGIBLE RECEIPTS FOR LOANS - WORKING
  apiRouter.get('/receipts/eligible-for-loans', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      
      const receipts = await storage.listWarehouseReceiptsByOwner(userId);

      // Filter eligible receipts
      const eligibleReceipts = receipts
        .filter(receipt => 
          receipt.status === 'active' &&
          receipt.availableForCollateral !== false &&
          parseFloat(receipt.valuation || '0') > 0
        )
        .map(receipt => {
          const receiptValue = parseFloat(receipt.valuation || '0');
          const collateralUsed = parseFloat(receipt.collateralUsed || '0');
          const availableLoanAmount = (receiptValue - collateralUsed) * 0.8;
          
          return {
            ...receipt,
            availableLoanAmount: Math.max(0, availableLoanAmount)
          };
        })
        .filter(receipt => receipt.availableLoanAmount > 0);

      res.json({ success: true, data: eligibleReceipts });
    } catch (error: any) {
      console.error('Eligible receipts error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ENHANCED LOAN APPLICATION - Multi-step form support
  apiRouter.post('/loans/apply', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const { 
        receiptIds, 
        requestedAmount, 
        tenureMonths = 12, 
        purpose = 'Working Capital',
        bankDetails,
        loanTerms
      } = req.body;

      // Validate required fields
      if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one receipt ID is required'
        });
      }

      if (!requestedAmount || requestedAmount < 10000) {
        return res.status(400).json({
          success: false,
          message: 'Minimum loan amount is ₹10,000'
        });
      }

      // Validate bank details
      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
        return res.status(400).json({
          success: false,
          message: 'Complete bank details are required'
        });
      }

      // Validate IFSC code format
      if (bankDetails.ifscCode.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'IFSC code must be 11 characters'
        });
      }

      // Fetch and validate all receipts
      const receipts = await Promise.all(
        receiptIds.map(id => storage.getWarehouseReceipt(id))
      );

      const validReceipts = receipts.filter((receipt): receipt is NonNullable<typeof receipt> => 
        receipt !== undefined &&
        receipt !== null && 
        receipt.ownerId === userId && 
        receipt.status === 'active' && 
        !receipt.liens
      );

      if (validReceipts.length !== receiptIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some receipts are invalid, not owned by you, or already collateralized'
        });
      }

      // Calculate total collateral value
      const totalCollateralValue = validReceipts.reduce((sum, receipt) => {
        return sum + parseFloat(receipt.valuation || '0');
      }, 0);

      const maxLoanAmount = Math.floor(totalCollateralValue * 0.8); // 80% LTV

      if (requestedAmount > maxLoanAmount) {
        return res.status(400).json({
          success: false,
          message: `Requested amount exceeds maximum available: ₹${maxLoanAmount.toLocaleString()}`
        });
      }

      // Calculate EMI and terms
      const interestRate = 12; // 12% annual
      const monthlyRate = interestRate / 12 / 100;
      const monthlyEMI = Math.round(
        (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      );
      const totalAmount = monthlyEMI * tenureMonths;
      const totalInterest = totalAmount - requestedAmount;
      const processingFee = Math.round(requestedAmount * 0.005); // 0.5%

      // Create loan record
      const loan = await storage.createLoan({
        userId: userId,
        lendingPartnerId: 1,
        lendingPartnerName: 'TradeWiser Direct Lending',
        amount: requestedAmount.toString(),
        interestRate: interestRate.toString(),
        endDate: new Date(Date.now() + tenureMonths * 30 * 24 * 60 * 60 * 1000),
        status: 'approved', // Auto-approve for demo
        collateralReceiptIds: JSON.stringify(receiptIds),
        outstandingAmount: requestedAmount.toString(),
        purpose,
        creditScore: 750,
        repaymentSchedule: JSON.stringify({
          monthlyEMI,
          totalAmount,
          totalInterest,
          processingFee,
          bankDetails,
          startDate: new Date(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      });

      // Update receipts to mark as collateralized
      await Promise.all(receiptIds.map(async (receiptId: number) => {
        await storage.updateWarehouseReceipt(receiptId, {
          status: 'collateralized',
          liens: JSON.stringify([{
            type: 'loan_collateral',
            loanId: loan.id,
            amount: requestedAmount,
            date: new Date().toISOString(),
            bankDetails: {
              accountNumber: bankDetails.accountNumber,
              ifscCode: bankDetails.ifscCode,
              accountHolderName: bankDetails.accountHolderName,
              bankName: bankDetails.bankName
            }
          }])
        });
      }));

      res.json({
        success: true,
        message: 'Loan approved successfully! Disbursement will be processed within 24 hours.',
        loan: {
          id: loan.id,
          amount: requestedAmount,
          status: 'approved',
          interestRate,
          tenureMonths,
          monthlyEMI,
          totalAmount,
          totalInterest,
          processingFee,
          disbursementDetails: {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            accountHolderName: bankDetails.accountHolderName,
            bankName: bankDetails.bankName
          },
          collateralReceipts: validReceipts.map(receipt => ({
            id: receipt.id,
            receiptNumber: receipt.receiptNumber,
            value: parseFloat(receipt.valuation || '0')
          }))
        }
      });

    } catch (error) {
      console.error('Loan application error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process loan application. Please try again.'
      });
    }
  });

  // Legacy single receipt loan application (keeping for backward compatibility)
  apiRouter.post('/loans/apply-legacy', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const { receiptId, amount, durationMonths } = req.body;

      if (!receiptId || !amount || !durationMonths) {
        return res.status(400).json({
          success: false,
          error: 'Receipt ID, amount, and duration are required'
        });
      }

      const receipt = await storage.getWarehouseReceipt(receiptId);

      if (!receipt || receipt.ownerId !== userId) {
        return res.status(400).json({ success: false, error: 'Receipt not found or not owned by user' });
      }

      const receiptValue = parseFloat(receipt.valuation || '0');
      const collateralUsed = parseFloat(receipt.collateralUsed || '0');
      const maxLoanAmount = (receiptValue - collateralUsed) * 0.8;

      if (parseFloat(amount) > maxLoanAmount) {
        return res.status(400).json({
          success: false,
          error: `Maximum available: ₹${maxLoanAmount.toLocaleString()}`
        });
      }

      // Calculate EMI
      const monthlyRate = 0.12 / 12; // 12% annual
      const emi = (parseFloat(amount) * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
                  (Math.pow(1 + monthlyRate, durationMonths) - 1);

      const loan = await storage.createLoan({
        userId: userId,
        lendingPartnerId: 1, // Default lending partner
        lendingPartnerName: 'TradeWiser Direct Lending',
        amount: amount,
        interestRate: '12.0',
        endDate: new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        collateralReceiptIds: JSON.stringify([receiptId]),
        outstandingAmount: amount,
        purpose: 'Working Capital',
        creditScore: 750
      });

      // Update collateral usage
      const newCollateralUsed = collateralUsed + parseFloat(amount);
      await storage.updateWarehouseReceipt(receiptId, {
        collateralUsed: newCollateralUsed.toString(),
        status: newCollateralUsed >= receiptValue ? 'collateralized' : 'active'
      });

      res.json({ 
        success: true, 
        data: {
          loan: loan,
          monthlyEmi: Math.round(emi),
          message: `Loan of ₹${parseFloat(amount).toLocaleString()} approved successfully!`
        }
      });
    } catch (error: any) {
      console.error('Loan application error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===============================
  // CREDIT LINE SYSTEM - FULL IMPLEMENTATION
  // ===============================

  // Get Available Credit
  apiRouter.get('/credit/available', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      console.log('=== CREDIT AVAILABLE DEBUG ===');
      console.log('User ID:', userId);
      
      const creditInfo = await storage.getAvailableCredit(userId);
      console.log('Credit info calculated:', JSON.stringify(creditInfo, null, 2));

      const responseData = {
        success: true,
        data: {
          totalCollateralValue: creditInfo.totalCollateralValue,
          maxEligibleCredit: creditInfo.maxEligibleCredit,
          outstandingBalance: creditInfo.outstandingBalance,
          availableCredit: creditInfo.availableCredit,
          utilizationPercentage: creditInfo.utilizationPercentage,
          interestRate: 12.0, // Fixed rate for demo
          processingTime: '2-4 business hours',
          minimumWithdrawal: 1000,
          maximumWithdrawal: creditInfo.availableCredit
        }
      };
      console.log('Sending response:', JSON.stringify(responseData, null, 2));

      res.json(responseData);
    } catch (error: any) {
      console.error('Error fetching available credit:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch available credit' });
    }
  });

  // Credit Line Details (Legacy endpoint)
  apiRouter.get('/credit-line/details', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const creditInfo = await storage.getAvailableCredit(userId);

      res.json({
        success: true,
        data: {
          totalLimit: creditInfo.maxEligibleCredit,
          availableBalance: creditInfo.availableCredit,
          outstandingAmount: creditInfo.outstandingBalance,
          interestRate: 12.0,
          dailyInterest: Math.round((creditInfo.outstandingBalance * 12 / 100 / 365) * 100) / 100,
          monthlyInterest: Math.round((creditInfo.outstandingBalance * 12 / 100 / 12) * 100) / 100,
          lastPaymentDate: '2025-09-01'
        }
      });
    } catch (error: any) {
      console.error('Credit line details error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Bank Account Management
  apiRouter.get('/credit/bank-accounts', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      console.log('=== BANK ACCOUNTS DEBUG ===');
      console.log('User ID:', userId);
      
      // Ensure demo bank accounts are seeded if none exist
      const bankAccounts = await storage.seedDemoBankAccounts(userId);
      
      // Return bank accounts with proper verification status
      const accountsWithStatus = bankAccounts.map(account => ({
        id: account.id,
        accountNumber: account.accountNumber,
        ifscCode: account.ifscCode,
        accountHolderName: account.accountHolderName,
        bankName: account.bankName,
        branchName: account.branchName,
        accountType: account.accountType,
        isDefault: account.isDefault,
        isVerified: account.isVerified,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));
      
      res.json({
        success: true,
        data: accountsWithStatus,
        meta: {
          total: accountsWithStatus.length,
          verified: accountsWithStatus.filter(acc => acc.isVerified).length,
          default: accountsWithStatus.find(acc => acc.isDefault)?.id || null
        }
      });
    } catch (error: any) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bank accounts' });
    }
  });

  apiRouter.post('/credit/bank-accounts', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      const { accountNumber, ifscCode, accountHolderName, bankName, branchName, accountType } = req.body;

      // Validate required fields
      if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: accountNumber, ifscCode, accountHolderName, bankName' 
        });
      }

      // Validate IFSC format
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid IFSC code format'
        });
      }

      // Validate account number (basic validation)
      if (accountNumber.length < 8 || accountNumber.length > 18) {
        return res.status(400).json({
          success: false,
          error: 'Account number must be between 8 and 18 characters'
        });
      }

      const bankAccount = await storage.createUserBankAccount({
        userId,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountHolderName,
        bankName,
        branchName: branchName || '',
        accountType: accountType || 'savings',
        isDefault: false,
        isVerified: true // Auto-verify for demo
      });

      // Return bank account with proper verification status
      const accountWithStatus = {
        id: bankAccount.id,
        accountNumber: bankAccount.accountNumber,
        ifscCode: bankAccount.ifscCode,
        accountHolderName: bankAccount.accountHolderName,
        bankName: bankAccount.bankName,
        branchName: bankAccount.branchName,
        accountType: bankAccount.accountType,
        isDefault: bankAccount.isDefault,
        isVerified: bankAccount.isVerified,
        createdAt: bankAccount.createdAt,
        updatedAt: bankAccount.updatedAt
      };

      res.json({
        success: true,
        data: accountWithStatus,
        message: 'Bank account added and verified successfully for demo purposes'
      });
    } catch (error: any) {
      console.error('Error creating bank account:', error);
      res.status(500).json({ success: false, error: 'Failed to create bank account' });
    }
  });

  // Credit Withdrawal
  apiRouter.post('/credit/withdraw', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId as number;
      console.log('=== CREDIT WITHDRAWAL DEBUG ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User ID:', userId);
      
      const { amount, bankAccountId, purpose } = req.body;
      console.log('Extracted values:', { amount, bankAccountId, purpose, types: { amount: typeof amount, bankAccountId: typeof bankAccountId } });

      // Enhanced amount validation
      if (amount === null || amount === undefined || amount === '') {
        console.log('VALIDATION FAILED: Amount is required');
        return res.status(400).json({ success: false, error: 'Withdrawal amount is required' });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || !isFinite(parsedAmount)) {
        return res.status(400).json({ success: false, error: 'Invalid withdrawal amount - must be a valid number' });
      }

      if (parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Withdrawal amount must be greater than zero' });
      }

      const MINIMUM_WITHDRAWAL = 1000;
      if (parsedAmount < MINIMUM_WITHDRAWAL) {
        return res.status(400).json({ 
          success: false, 
          error: `Minimum withdrawal amount is ₹${MINIMUM_WITHDRAWAL.toLocaleString()}` 
        });
      }

      // Check available credit with explicit maximum validation
      const creditInfo = await storage.getAvailableCredit(userId);
      const maxWithdrawal = Math.floor(creditInfo.availableCredit);
      
      if (parsedAmount > maxWithdrawal) {
        return res.status(400).json({ 
          success: false, 
          error: `Withdrawal amount exceeds available credit. Maximum allowed: ₹${maxWithdrawal.toLocaleString()}, Available: ₹${creditInfo.availableCredit.toLocaleString()}` 
        });
      }

      // Enhanced bank account validation
      if (bankAccountId === null || bankAccountId === undefined || bankAccountId === '') {
        return res.status(400).json({ success: false, error: 'Bank account selection is required' });
      }

      const parsedBankAccountId = parseInt(bankAccountId);
      if (isNaN(parsedBankAccountId) || !isFinite(parsedBankAccountId)) {
        return res.status(400).json({ success: false, error: 'Invalid bank account selection' });
      }

      const bankAccount = await storage.getUserBankAccount(parsedBankAccountId);
      if (!bankAccount) {
        return res.status(400).json({ success: false, error: 'Selected bank account does not exist' });
      }

      if (bankAccount.userId !== userId) {
        return res.status(400).json({ success: false, error: 'Bank account does not belong to current user' });
      }

      if (!bankAccount.isVerified) {
        return res.status(400).json({ 
          success: false, 
          error: 'Selected bank account is not verified. Please verify your bank account before withdrawing funds.' 
        });
      }

      // Create withdrawal request with validated data
      const withdrawal = await storage.createCreditWithdrawal({
        userId,
        bankAccountId: parsedBankAccountId,
        amount: parsedAmount.toString(),
        availableCreditAtTime: creditInfo.availableCredit.toString(),
        status: 'approved', // Auto-approve for demo
        withdrawalMethod: 'bank_transfer',
        processingFee: '0',
        actualAmount: parsedAmount.toString(),
        metadata: {
          purpose: purpose || 'Working Capital',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          validationChecks: {
            amountValidated: true,
            bankAccountValidated: true,
            creditLimitValidated: true,
            timestamp: new Date().toISOString()
          }
        }
      });

      // For demo purposes, immediately complete the withdrawal
      await storage.updateCreditWithdrawal(withdrawal.id, {
        status: 'completed',
        externalTransactionId: `TXN${Date.now()}`,
        transactionReference: `REF${withdrawal.id}${Date.now()}`
      });

      res.json({
        success: true,
        data: {
          withdrawalId: withdrawal.id,
          transactionId: `TXN${Date.now()}`,
          amount: parsedAmount,
          bankAccount: {
            accountNumber: `****${bankAccount.accountNumber.slice(-4)}`,
            bankName: bankAccount.bankName,
            accountHolderName: bankAccount.accountHolderName,
            isVerified: bankAccount.isVerified
          },
          status: 'completed',
          processingTime: '2-4 business hours',
          estimatedCreditTime: 'Within 1 business day',
          remainingCredit: creditInfo.availableCredit - parsedAmount,
          message: `Withdrawal of ₹${parsedAmount.toLocaleString()} has been processed successfully to ${bankAccount.bankName} account ending in ${bankAccount.accountNumber.slice(-4)}!`
        }
      });
    } catch (error: any) {
      console.error('Credit withdrawal error:', error);
      res.status(500).json({ success: false, error: 'Failed to process withdrawal' });
    }
  });

  // Legacy withdraw endpoint
  apiRouter.post('/credit-line/withdraw', requireAuth, async (req: Request, res: Response) => {
    // Redirect to new endpoint
    return res.redirect(307, '/api/credit/withdraw');
  });

  // Test endpoint
  apiRouter.get("/test", (req: Request, res: Response) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Enhanced Authentication System - Phone/OTP, Username/Password, Social Login
  app.use("/api/auth", authRouter);

  // Mount API router on /api path
  app.use("/api", apiRouter);
  
  // Handle 404 for unknown API routes - this must be last
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });

  console.log("API routes registered successfully");
  
  const httpServer = createServer(app);

  // Initialize WebSocket server on /ws path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });

  // Map to store active connections by user ID, entity type, and entity ID
  const connections = new Map<string, WebSocket[]>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    const subscriptions: {userId: string, entityType: string, entityId: string}[] = [];

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'subscribe' && data.userId) {
          const userId = data.userId.toString();
          
          if (data.processId) {
            const processId = data.processId.toString();
            const entityType = 'process';
            addSubscription(ws, userId, entityType, processId, subscriptions);
          }
          else if (data.entityType && data.entityId) {
            const entityType = data.entityType.toString();
            const entityId = data.entityId.toString();
            addSubscription(ws, userId, entityType, entityId, subscriptions);
          }
        }
        else if (data.type === 'unsubscribe' && data.userId) {
          const userId = data.userId.toString();

          if (data.entityType && data.entityId) {
            const entityType = data.entityType.toString(); 
            const entityId = data.entityId.toString();
            removeSubscription(ws, userId, entityType, entityId, subscriptions);
          }
          else if (data.processId) {
            const processId = data.processId.toString();
            const entityType = 'process';
            removeSubscription(ws, userId, entityType, processId, subscriptions);
          }
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      subscriptions.forEach(sub => {
        const key = sub.userId + ":" + sub.entityType + ":" + sub.entityId;
        const clients = connections.get(key) || [];
        const index = clients.indexOf(ws);

        if (index !== -1) {
          clients.splice(index, 1);
          if (clients.length === 0) {
            connections.delete(key);
          } else {
            connections.set(key, clients);
          }
        }
      });
      console.log('WebSocket client disconnected');
    });

    function addSubscription(
      ws: WebSocket,
      userId: string,
      entityType: string,
      entityId: string,
      subscriptions: {userId: string, entityType: string, entityId: string}[]
    ) {
      const key = userId + ":" + entityType + ":" + entityId;

      if (!connections.has(key)) {
        connections.set(key, []);
      }

      if (!connections.get(key)?.includes(ws)) {
        connections.get(key)?.push(ws);
      }

      const existingSubscription = subscriptions.find(
        s => s.userId === userId && s.entityType === entityType && s.entityId === entityId
      );

      if (!existingSubscription) {
        subscriptions.push({ userId, entityType, entityId });
      }

      ws.send(JSON.stringify({
        type: 'subscribed',
        entityType,
        entityId,
        userId,
        timestamp: new Date().toISOString()
      }));

      console.log("User " + userId + " subscribed to " + entityType + " " + entityId);
    }

    function removeSubscription(
      ws: WebSocket,
      userId: string,
      entityType: string,
      entityId: string,
      subscriptions: {userId: string, entityType: string, entityId: string}[]
    ) {
      const key = userId + ":" + entityType + ":" + entityId;
      const clients = connections.get(key) || [];
      const index = clients.indexOf(ws);

      if (index !== -1) {
        clients.splice(index, 1);
        if (clients.length === 0) {
          connections.delete(key);
        } else {
          connections.set(key, clients);
        }
      }

      const subIndex = subscriptions.findIndex(
        s => s.userId === userId && s.entityType === entityType && s.entityId === entityId
      );

      if (subIndex !== -1) {
        subscriptions.splice(subIndex, 1);
      }

      ws.send(JSON.stringify({
        type: 'unsubscribed',
        entityType,
        entityId,
        userId,
        timestamp: new Date().toISOString()
      }));

      console.log("User " + userId + " unsubscribed from " + entityType + " " + entityId);
    }
  });

  // Global broadcast function for webhook updates
  globalThis.broadcastEntityUpdate = function(userId: number, entityType: string, entityId: number, updateData: any) {
    const key = userId + ":" + entityType + ":" + entityId;
    const clients = connections.get(key) || [];

    if (clients.length === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'entity_update',
      entityType,
      entityId,
      userId,
      data: updateData,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log("Sent " + entityType + " update to " + clients.length + " clients for " + entityType + " " + entityId);
  }

  // Make outbound API functions globally available
  globalThis.sendToWarehouseModule = sendToWarehouseModule;
  globalThis.requestQualityTesting = requestQualityTesting;

  return httpServer;
}