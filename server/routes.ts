import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWarehouseSchema, insertCommoditySchema, insertWarehouseReceiptSchema, insertLoanSchema, insertProcessSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import 'express-session';

// Extend Express Request to include session
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();

  // Auth routes
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const validData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const emailExists = await storage.getUserByEmail(validData.email);
      if (emailExists) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(validData);
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
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
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/auth/session", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });

  // Warehouse routes
  apiRouter.get("/warehouses", async (req: Request, res: Response) => {
    try {
      const warehouses = await storage.listWarehouses();
      res.status(200).json(warehouses);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/warehouses/nearby", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius } = req.query;
      
      if (!latitude || !longitude || !radius) {
        return res.status(400).json({ message: "Latitude, longitude and radius are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const rad = parseFloat(radius as string);
      
      if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
        return res.status(400).json({ message: "Invalid latitude, longitude or radius" });
      }
      
      const warehouses = await storage.listWarehousesByLocation(lat, lng, rad);
      res.status(200).json(warehouses);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      
      const warehouse = await storage.getWarehouse(id);
      
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      res.status(200).json(warehouse);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/warehouses", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(validData);
      
      res.status(201).json(warehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Commodity routes
  apiRouter.get("/commodities", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const commodities = await storage.listCommoditiesByOwner(req.session.userId);
      res.status(200).json(commodities);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/commodities/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid commodity ID" });
      }
      
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }
      
      // Check if user owns the commodity
      if (commodity.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this commodity" });
      }
      
      res.status(200).json(commodity);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/commodities", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validData = insertCommoditySchema.parse({
        ...req.body,
        ownerId: req.session.userId
      });
      
      const commodity = await storage.createCommodity(validData);
      
      res.status(201).json(commodity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Warehouse Receipt routes
  apiRouter.get("/receipts", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const receipts = await storage.listWarehouseReceiptsByOwner(req.session.userId);
      res.status(200).json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/receipts/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid receipt ID" });
      }
      
      const receipt = await storage.getWarehouseReceipt(id);
      
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      // Check if user owns the receipt
      if (receipt.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this receipt" });
      }
      
      res.status(200).json(receipt);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/receipts", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validData = insertWarehouseReceiptSchema.parse({
        ...req.body,
        ownerId: req.session.userId
      });
      
      const receipt = await storage.createWarehouseReceipt(validData);
      
      res.status(201).json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Loan routes
  apiRouter.get("/loans", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const loans = await storage.listLoansByUser(req.session.userId);
      res.status(200).json(loans);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/loans/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid loan ID" });
      }
      
      const loan = await storage.getLoan(id);
      
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      // Check if user owns the loan
      if (loan.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this loan" });
      }
      
      res.status(200).json(loan);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/loans", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validData = insertLoanSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const loan = await storage.createLoan(validData);
      
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Process routes
  apiRouter.get("/processes", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const processes = await storage.listProcessesByUser(req.session.userId);
      res.status(200).json(processes);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.get("/processes/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getProcess(id);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }
      
      // Check if user owns the process
      if (process.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this process" });
      }
      
      res.status(200).json(process);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/processes", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validData = insertProcessSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const process = await storage.createProcess(validData);
      
      res.status(201).json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  apiRouter.patch("/processes/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getProcess(id);
      
      if (!process) {
        return res.status(404).json({ message: "Process not found" });
      }
      
      // Check if user owns the process
      if (process.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this process" });
      }
      
      const updatedProcess = await storage.updateProcess(id, req.body);
      res.status(200).json(updatedProcess);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Add all API routes under /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
