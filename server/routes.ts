import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
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

  // Commodity routes
  apiRouter.get("/commodities", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const commodities = await storage.listCommoditiesByOwner(req.session.userId);
      res.json(commodities);
    } catch (error) {
      console.error("Error fetching commodities:", error);
      res.status(500).json({ message: "Failed to fetch commodities" });
    }
  });

  // Receipt routes
  apiRouter.get("/receipts", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const receipts = await storage.listWarehouseReceiptsByOwner(req.session.userId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  // Process routes (for deposits and workflows)
  apiRouter.get("/processes", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const processes = await storage.listProcessesByUser(req.session.userId);
      res.json(processes);
    } catch (error) {
      console.error("Error fetching processes:", error);
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
      
      res.json(process);
    } catch (error) {
      console.error("Error fetching process:", error);
      res.status(500).json({ message: "Failed to fetch process" });
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
        status: "pending_deposit",
        channelType: "green",
        valuation: estimatedValue?.toString() || "0"
      });

      // Then create the process
      const processData = {
        type: type || "deposit",
        userId: req.session.userId,
        commodityId: commodity.id,
        warehouseId: parseInt(warehouseId),
        status: "initiated",
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
      
      res.status(201).json(process);
    } catch (error) {
      console.error("Error creating process:", error);
      res.status(500).json({ message: "Failed to create deposit process" });
    }
  });

  // Test endpoint
  apiRouter.get("/test", (req: Request, res: Response) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  app.use("/api", apiRouter);
  
  console.log("API routes registered successfully");
  
  const httpServer = createServer(app);
  return httpServer;
}