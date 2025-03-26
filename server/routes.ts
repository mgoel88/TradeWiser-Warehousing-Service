import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
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

  // GREEN CHANNEL: Withdraw commodity (partial or complete)
  apiRouter.post("/commodities/:id/withdraw", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid commodity ID" });
      }
      
      const { quantity } = req.body;
      
      if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }
      
      // Validate withdrawal amount
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }
      
      // Check if user owns the commodity
      if (commodity.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to withdraw this commodity" });
      }
      
      // Check commodity status
      if (commodity.status !== 'active') {
        return res.status(400).json({ message: `Cannot withdraw commodity with status '${commodity.status}'` });
      }
      
      // Check if commodity is in green channel
      if (commodity.channelType !== 'green') {
        return res.status(400).json({ message: "Only green channel commodities can be withdrawn directly" });
      }
      
      // Check if quantity is valid
      const requestedQuantity = parseFloat(quantity);
      const availableQuantity = parseFloat(commodity.quantity.toString());
      
      if (requestedQuantity > availableQuantity) {
        return res.status(400).json({ message: "Requested quantity exceeds available quantity" });
      }
      
      // Process withdrawal
      if (requestedQuantity === availableQuantity) {
        // Complete withdrawal
        const updatedCommodity = await storage.updateCommodity(id, {
          status: "withdrawn",
          quantity: "0"
        });
        
        // Create a withdrawal process
        await storage.createProcess({
          commodityId: id,
          warehouseId: commodity.warehouseId,
          userId: req.session.userId,
          processType: "withdrawal",
          status: "completed",
          currentStage: "completed",
          stageProgress: {
            withdrawal_initiated: "completed",
            warehouse_verification: "completed",
            physical_release: "completed"
          },
          estimatedCompletionTime: new Date()
        });
        
        res.status(200).json({ 
          message: "Commodity fully withdrawn", 
          commodity: updatedCommodity 
        });
      } else {
        // Partial withdrawal
        const remainingQuantity = (availableQuantity - requestedQuantity).toString();
        
        const updatedCommodity = await storage.updateCommodity(id, {
          quantity: remainingQuantity
        });
        
        // Create a withdrawal process
        await storage.createProcess({
          commodityId: id,
          warehouseId: commodity.warehouseId,
          userId: req.session.userId,
          processType: "partial_withdrawal",
          status: "completed",
          currentStage: "completed",
          stageProgress: {
            withdrawal_initiated: "completed",
            warehouse_verification: "completed",
            physical_release: "completed"
          },
          estimatedCompletionTime: new Date()
        });
        
        res.status(200).json({ 
          message: `${quantity} ${commodity.measurementUnit} withdrawn successfully`, 
          commodity: updatedCommodity,
          withdrawnQuantity: quantity
        });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: "Server error during withdrawal" });
    }
  });

  // GREEN CHANNEL: Transfer commodity ownership
  apiRouter.post("/commodities/:id/transfer-ownership", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid commodity ID" });
      }
      
      const { newOwnerId } = req.body;
      
      if (!newOwnerId || isNaN(parseInt(newOwnerId))) {
        return res.status(400).json({ message: "Valid new owner ID is required" });
      }
      
      // Get the commodity
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }
      
      // Check if user owns the commodity
      if (commodity.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to transfer this commodity" });
      }
      
      // Check commodity status
      if (commodity.status !== 'active') {
        return res.status(400).json({ message: `Cannot transfer commodity with status '${commodity.status}'` });
      }
      
      // Check if commodity is in green channel
      if (commodity.channelType !== 'green') {
        return res.status(400).json({ message: "Only green channel commodities can be transferred directly" });
      }
      
      // Check if new owner exists
      const newOwner = await storage.getUser(parseInt(newOwnerId));
      
      if (!newOwner) {
        return res.status(404).json({ message: "New owner not found" });
      }
      
      // Process transfer
      const updatedCommodity = await storage.updateCommodity(id, {
        ownerId: parseInt(newOwnerId)
      });
      
      // Create a transfer process
      await storage.createProcess({
        commodityId: id,
        warehouseId: commodity.warehouseId,
        userId: req.session.userId,
        processType: "ownership_transfer",
        status: "completed",
        currentStage: "completed",
        stageProgress: {
          transfer_initiated: "completed",
          ownership_verification: "completed",
          records_updated: "completed"
        },
        estimatedCompletionTime: new Date()
      });
      
      // Also update related warehouse receipts
      const receipts = await storage.listWarehouseReceiptsByCommodity(id);
      for (const receipt of receipts) {
        await storage.updateWarehouseReceipt(receipt.id, {
          ownerId: parseInt(newOwnerId)
        });
      }
      
      res.status(200).json({ 
        message: "Commodity ownership transferred successfully", 
        commodity: updatedCommodity,
        newOwner: {
          id: newOwner.id,
          fullName: newOwner.fullName,
          username: newOwner.username
        }
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Server error during ownership transfer" });
    }
  });

  // GREEN CHANNEL: Transfer commodity to another warehouse
  apiRouter.post("/commodities/:id/transfer-warehouse", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid commodity ID" });
      }
      
      const { newWarehouseId } = req.body;
      
      if (!newWarehouseId || isNaN(parseInt(newWarehouseId))) {
        return res.status(400).json({ message: "Valid new warehouse ID is required" });
      }
      
      // Get the commodity
      const commodity = await storage.getCommodity(id);
      
      if (!commodity) {
        return res.status(404).json({ message: "Commodity not found" });
      }
      
      // Check if user owns the commodity
      if (commodity.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to transfer this commodity" });
      }
      
      // Check commodity status
      if (commodity.status !== 'active') {
        return res.status(400).json({ message: `Cannot transfer commodity with status '${commodity.status}'` });
      }
      
      // Check if commodity is in green channel
      if (commodity.channelType !== 'green') {
        return res.status(400).json({ message: "Only green channel commodities can be transferred directly" });
      }
      
      // Check if new warehouse exists
      const newWarehouse = await storage.getWarehouse(parseInt(newWarehouseId));
      
      if (!newWarehouse) {
        return res.status(404).json({ message: "New warehouse not found" });
      }
      
      // Check if new warehouse has enough space
      const commodityQuantity = parseFloat(commodity.quantity.toString());
      const warehouseAvailableSpace = parseFloat(newWarehouse.availableSpace.toString());
      
      if (commodityQuantity > warehouseAvailableSpace) {
        return res.status(400).json({ 
          message: "Not enough space in target warehouse", 
          required: commodityQuantity,
          available: warehouseAvailableSpace
        });
      }
      
      // Update space in old warehouse (increase available space)
      const oldWarehouse = await storage.getWarehouse(parseInt(commodity.warehouseId?.toString() || "0"));
      if (oldWarehouse) {
        const updatedAvailableSpace = (parseFloat(oldWarehouse.availableSpace.toString()) + commodityQuantity).toString();
        await storage.updateWarehouse(oldWarehouse.id, {
          availableSpace: updatedAvailableSpace
        });
      }
      
      // Update space in new warehouse (decrease available space)
      const updatedNewWarehouseSpace = (warehouseAvailableSpace - commodityQuantity).toString();
      await storage.updateWarehouse(newWarehouse.id, {
        availableSpace: updatedNewWarehouseSpace
      });
      
      // Process warehouse transfer
      const updatedCommodity = await storage.updateCommodity(id, {
        warehouseId: parseInt(newWarehouseId),
        status: "transferred"
      });
      
      // Create a warehouse transfer process
      await storage.createProcess({
        commodityId: id,
        warehouseId: parseInt(newWarehouseId),
        userId: req.session.userId,
        processType: "warehouse_transfer",
        status: "in_progress",
        currentStage: "transit",
        stageProgress: {
          transfer_initiated: "completed",
          pickup_from_source: "completed",
          in_transit: "in_progress",
          delivery_to_destination: "pending",
          quality_verification: "pending",
          records_updated: "pending"
        },
        estimatedCompletionTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
      
      // Also update related warehouse receipts
      const receipts = await storage.listWarehouseReceiptsByCommodity(id);
      for (const receipt of receipts) {
        await storage.updateWarehouseReceipt(receipt.id, {
          warehouseId: parseInt(newWarehouseId),
          status: "transferred"
        });
      }
      
      res.status(200).json({ 
        message: "Commodity transfer to new warehouse initiated", 
        commodity: updatedCommodity,
        sourceWarehouse: {
          id: oldWarehouse?.id,
          name: oldWarehouse?.name
        },
        destinationWarehouse: {
          id: newWarehouse.id,
          name: newWarehouse.name
        }
      });
    } catch (error) {
      console.error("Warehouse transfer error:", error);
      res.status(500).json({ message: "Server error during warehouse transfer" });
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
