import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  console.log("Registering API routes...");

  // Session validation middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Auth routes
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

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log("Login attempt failed: Username not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = user.password === password;
      
      if (!isValidPassword) {
        console.log("Login attempt failed: Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
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
      const allowedTypes = /jpeg|jpg|png|pdf|csv|xlsx|xls/;
      const fileType = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = allowedTypes.test(file.mimetype);
      
      if (mimeType && fileType) {
        return cb(null, true);
      } else {
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

  // Nearby warehouses route
  apiRouter.get("/warehouses/nearby", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius = 50 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      // For demo purposes, return all warehouses
      // In production, this would filter by geographic proximity
      const warehouses = await storage.listWarehouses();
      
      res.setHeader('Content-Type', 'application/json');
      res.json(warehouses.slice(0, 3)); // Return closest 3
    } catch (error) {
      console.error("Error fetching nearby warehouses:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch nearby warehouses" });
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

  // Test endpoint
  apiRouter.get("/test", (req: Request, res: Response) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Mount API router on /api path
  app.use("/api", apiRouter);
  
  // Handle 404 for unknown API routes - this must be last
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
  });
  
  console.log("API routes registered successfully");
  
  const httpServer = createServer(app);
  return httpServer;
}