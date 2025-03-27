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
      
      // Enhance receipts with commodity and warehouse data
      const enhancedReceipts = await Promise.all(receipts.map(async (receipt) => {
        // Get the liens field as a properly typed object
        const liens: Record<string, any> = typeof receipt.liens === 'object' && receipt.liens !== null 
          ? (receipt.liens as any) 
          : {};
        
        // Get related entities
        let commodity = null;
        let warehouse = null;
        
        if (receipt.commodityId) {
          commodity = await storage.getCommodity(receipt.commodityId);
        }
        
        if (receipt.warehouseId) {
          warehouse = await storage.getWarehouse(receipt.warehouseId);
        }
        
        // Return an enhanced receipt with client-expected fields
        return {
          ...receipt,
          // Add fields that the client might expect, sourced from liens and related entities
          commodityName: commodity ? commodity.name : liens.commodityName || 'Unknown',
          qualityGrade: liens.qualityGrade || 'Standard',
          warehouseName: warehouse ? warehouse.name : liens.warehouseName || 'Unknown',
          warehouseAddress: warehouse ? warehouse.address : liens.warehouseAddress || 'Unknown',
          // Add a metadata field for compatibility with client code
          metadata: {
            verificationCode: liens.verificationCode || '',
            processId: liens.processId || 0,
            depositDate: liens.depositDate || receipt.issuedDate,
            expiryDate: liens.expiryDate || receipt.expiryDate
          }
        };
      }));
      
      res.status(200).json(enhancedReceipts);
    } catch (error) {
      console.error("Error retrieving receipts:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // New endpoints for blockchain-secured receipts

  // Get receipts available to use as collateral
  apiRouter.get("/receipts/available-collateral", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get all receipts owned by the user that are active (not collateralized)
      const receipts = await storage.listWarehouseReceiptsByOwner(req.session.userId);
      const activeReceipts = receipts.filter(receipt => receipt.status === "active");
      
      // Enhance receipts with commodity and warehouse data
      const enhancedReceipts = await Promise.all(activeReceipts.map(async (receipt) => {
        // Get the liens field as a properly typed object
        const liens: Record<string, any> = typeof receipt.liens === 'object' && receipt.liens !== null 
          ? (receipt.liens as any) 
          : {};
        
        // Get related entities
        let commodity = null;
        let warehouse = null;
        
        if (receipt.commodityId) {
          commodity = await storage.getCommodity(receipt.commodityId);
        }
        
        if (receipt.warehouseId) {
          warehouse = await storage.getWarehouse(receipt.warehouseId);
        }
        
        // Return an enhanced receipt with client-expected fields
        return {
          ...receipt,
          // Add fields that the client might expect, sourced from liens and related entities
          commodityName: commodity ? commodity.name : liens.commodityName || 'Unknown',
          qualityGrade: liens.qualityGrade || 'Standard',
          warehouseName: warehouse ? warehouse.name : liens.warehouseName || 'Unknown',
          warehouseAddress: warehouse ? warehouse.address : liens.warehouseAddress || 'Unknown',
          // Add a metadata field for compatibility with client code
          metadata: {
            verificationCode: liens.verificationCode || '',
            processId: liens.processId || 0,
            depositDate: liens.depositDate || receipt.issuedDate,
            expiryDate: liens.expiryDate || receipt.expiryDate
          }
        };
      }));
      
      res.status(200).json(enhancedReceipts);
    } catch (error) {
      console.error("Error retrieving available collateral receipts:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Transfer ownership of a receipt with blockchain recording
  apiRouter.post("/receipts/:id/transfer", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const receiptId = parseInt(req.params.id);
      if (isNaN(receiptId)) {
        return res.status(400).json({ message: "Invalid receipt ID" });
      }
      
      // Validate required fields
      const { receiverId, transferType, transactionHash, note } = req.body;
      
      if (!receiverId || !transferType || !transactionHash) {
        return res.status(400).json({ 
          message: "Missing required fields: receiverId, transferType, and transactionHash are required" 
        });
      }
      
      // Verify the receipt exists and is owned by the current user
      const receipt = await storage.getWarehouseReceipt(receiptId);
      
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      if (receipt.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to transfer this receipt" });
      }
      
      if (receipt.status !== "active") {
        return res.status(400).json({ 
          message: `Receipt cannot be transferred in '${receipt.status}' status` 
        });
      }
      
      // Create transfer record
      const transferRecord = {
        receiptId,
        fromUserId: req.session.userId,
        toUserId: receiverId,
        transferType,
        transactionHash,
        metadata: note ? JSON.stringify({ note }) : null
      };
      
      // Create the transfer record
      await storage.createReceiptTransfer(transferRecord);
      
      // Get the current receipt to access existing liens
      const currentReceipt = await storage.getWarehouseReceipt(receiptId);
      
      // Get existing liens as an object or create new empty object
      const liens = (currentReceipt && currentReceipt.liens && typeof currentReceipt.liens === 'object')
        ? { ...(currentReceipt.liens as Record<string, any>) }
        : {};
      
      // Add transfer history to liens
      liens.transferHistory = liens.transferHistory || [];
      liens.transferHistory.push({
        date: new Date().toISOString(),
        fromUserId: req.session.userId,
        toUserId: receiverId,
        transferType,
        transactionHash
      });
      
      // Update receipt ownership with new liens
      const updatedReceipt = await storage.updateWarehouseReceipt(receiptId, {
        ownerId: receiverId,
        liens: liens
      });
      
      if (!updatedReceipt) {
        throw new Error("Failed to update receipt ownership");
      }
      
      res.status(200).json({ 
        message: "Ownership transferred successfully",
        receipt: updatedReceipt
      });
    } catch (error) {
      console.error("Error transferring receipt:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Verify receipt by verification code - no auth required for public verification
  apiRouter.get("/receipts/verify/:code", async (req: Request, res: Response) => {
    try {
      const verificationCode = req.params.code;
      
      // Get all receipts and filter by verification code
      // In a real blockchain app, we would verify this with the blockchain network
      const receipts = await storage.listWarehouseReceipts();
      const receipt = receipts.find(r => {
        // Check in liens field for verification code (we're storing metadata in liens)
        if (r.liens && typeof r.liens === 'object') {
          const liens = r.liens as Record<string, any>;
          if (liens.verificationCode === verificationCode) {
            return true;
          }
        }
        
        // Fallback to checking receipt number (for backward compatibility)
        return r.receiptNumber.includes(verificationCode);
      });
      
      if (!receipt) {
        return res.status(404).json({ message: "Receipt verification failed" });
      }
      
      // Get the liens field as a properly typed object
      const liens: Record<string, any> = typeof receipt.liens === 'object' && receipt.liens !== null 
        ? (receipt.liens as any) 
        : {};
      
      // Return a cleaned version of the receipt with essential data derived from the liens field
      const cleanedReceipt = {
        ...receipt,
        // Add any missing fields that the client might expect
        commodityName: liens.commodityName || 'Unknown',
        qualityGrade: liens.qualityGrade || 'Unknown',
        // Add a metadata field for compatibility with client code
        metadata: {
          verificationCode: liens.verificationCode || verificationCode,
          processId: liens.processId || 0
        }
      };
      
      res.status(200).json(cleanedReceipt);
    } catch (error) {
      console.error("Receipt verification error:", error);
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
      
      // Get the liens field as a properly typed object (used for additional metadata)
      const liens: Record<string, any> = typeof receipt.liens === 'object' && receipt.liens !== null 
        ? (receipt.liens as any) 
        : {};
      
      // Fetch related commodity and warehouse info to enhance the receipt data
      let commodity = null;
      let warehouse = null;
      
      if (receipt.commodityId) {
        commodity = await storage.getCommodity(receipt.commodityId);
      }
      
      if (receipt.warehouseId) {
        warehouse = await storage.getWarehouse(receipt.warehouseId);
      }
      
      // Return an enhanced receipt with client-expected fields
      const enhancedReceipt = {
        ...receipt,
        // Add fields that the client might expect, sourced from liens and related entities
        commodityName: commodity ? commodity.name : liens.commodityName || 'Unknown',
        qualityGrade: liens.qualityGrade || 'Standard',
        warehouseName: warehouse ? warehouse.name : liens.warehouseName || 'Unknown',
        warehouseAddress: warehouse ? warehouse.address : liens.warehouseAddress || 'Unknown',
        // Add a metadata field for compatibility with client code
        metadata: {
          verificationCode: liens.verificationCode || '',
          processId: liens.processId || 0,
          depositDate: liens.depositDate || receipt.issuedDate,
          expiryDate: liens.expiryDate || receipt.expiryDate
        }
      };
      
      res.status(200).json(enhancedReceipt);
    } catch (error) {
      console.error("Error retrieving receipt:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/receipts", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Import receipt service dynamically to avoid circular dependencies
      const { receiptService } = await import('./services/ReceiptService');
      
      // Log the raw payload for debugging
      console.log("Creating warehouse receipt with payload:", req.body);
      
      // Use the dedicated receipt service to create the receipt
      // This will handle all the data conversion, validation, and defaults
      const receipt = await receiptService.createReceipt(req.body, req.session.userId);
      
      console.log("Receipt created successfully:", receipt.id);
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating receipt:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ 
          message: "Server error: " + (error instanceof Error ? error.message : String(error)),
          details: error instanceof Error ? error.stack : undefined
        });
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
      
      // Ensure we properly handle the estimatedCompletionTime
      let processData = { ...req.body, userId: req.session.userId };
      
      // If we have a date string, convert it to a proper Date object
      if (processData.estimatedCompletionTime && typeof processData.estimatedCompletionTime === 'string') {
        processData.estimatedCompletionTime = new Date(processData.estimatedCompletionTime);
      }
      
      const validData = insertProcessSchema.parse(processData);
      
      const process = await storage.createProcess(validData);
      
      // If this is a deposit or inward_processing process, simulate automatic updates for demo purposes
      if ((process.processType === 'deposit' || process.processType === 'inward_processing') && process.status === 'pending') {
        setTimeout(() => {
          console.log(`Setting up demo process simulation for process ${process.id}`);
          
          const simulateProcessUpdates = async () => {
            try {
              const broadcastUpdate = (global as any).broadcastProcessUpdate;
              if (typeof broadcastUpdate !== 'function') return;
              
              // Initial notification
              broadcastUpdate(process.userId, process.id, {
                process: process,
                update: {
                  message: 'Process tracking initialized',
                  status: 'pending',
                  progress: 5
                }
              });
              
              // Define update stages with proper typing
              interface ProcessUpdate {
                delay: number;
                message: string;
                stage: string;
                progress: number;
              }
              
              // Demo updates with process stages
              const updates: ProcessUpdate[] = [
                {
                  delay: 5000,
                  message: 'Pickup scheduled successfully',
                  stage: 'pickup_scheduled',
                  progress: 15
                },
                {
                  delay: 10000,
                  message: 'Vehicle assigned for pickup',
                  stage: 'pickup_assigned',
                  progress: 30
                },
                {
                  delay: 15000,
                  message: 'Vehicle en route to pickup location',
                  stage: 'pickup_in_progress', 
                  progress: 40
                },
                {
                  delay: 20000,
                  message: 'Commodity arrived at warehouse',
                  stage: 'arrived_at_warehouse',
                  progress: 60
                },
                {
                  delay: 25000,
                  message: 'Pre-cleaning in progress',
                  stage: 'pre_cleaning',
                  progress: 75
                },
                {
                  delay: 30000,
                  message: 'Quality assessment completed',
                  stage: 'quality_assessment',
                  progress: 90
                },
                {
                  delay: 35000,
                  message: 'Electronic Warehouse Receipt generated',
                  stage: 'ewr_generation',
                  progress: 100
                }
              ];
              
              // Simulate each update with appropriate delay
              updates.forEach((update, index) => {
                setTimeout(() => {
                  try {
                    // Get latest process data before update
                    storage.getProcess(process.id).then(currentProcess => {
                      if (!currentProcess) return;
                      
                      // Directly create a new object with the proper type signature
                      // This avoids the typescript error with the empty object
                      const stageProgress: Record<string, string> = {};
                      
                      // Cast stageProgress to a safe type and copy existing values
                      const currentStageProgress = currentProcess.stageProgress as Record<string, string> | null;
                      if (currentStageProgress && typeof currentStageProgress === 'object') {
                        Object.entries(currentStageProgress).forEach(([key, value]) => {
                          if (typeof value === 'string') {
                            stageProgress[key] = value;
                          }
                        });
                      }
                      
                      // Set current stage to in_progress
                      stageProgress[update.stage] = 'in_progress';
                      
                      // Mark previous stages as completed
                      if (index > 0) {
                        const prevStage = updates[index - 1].stage;
                        stageProgress[prevStage] = 'completed';
                      }
                      
                      // Prepare process update
                      const processStatus = index === updates.length - 1 ? 'completed' : 'in_progress';
                      
                      // Update process in database
                      storage.updateProcess(process.id, {
                        status: processStatus as any,
                        currentStage: update.stage,
                        stageProgress: stageProgress
                      }).then(updatedProcess => {
                        // Broadcast update via WebSocket
                        broadcastUpdate(process.userId, process.id, {
                          process: updatedProcess,
                          update: {
                            message: update.message,
                            stage: update.stage,
                            status: processStatus,
                            progress: update.progress
                          }
                        });
                        
                        console.log(`Process ${process.id} updated to stage: ${update.stage} (${update.progress}%)`);
                      });
                    });
                  } catch (err) {
                    console.error(`Error in process update simulation:`, err);
                  }
                }, update.delay);
              });
            } catch (err) {
              console.error('Error in process simulation:', err);
            }
          };
          
          // Start the simulation
          simulateProcessUpdates();
        }, 2000);
      }
      
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
      
      // Broadcast update to WebSocket clients
      const broadcastUpdate = (global as any).broadcastProcessUpdate;
      if (typeof broadcastUpdate === 'function') {
        broadcastUpdate(process.userId, id, {
          process: updatedProcess,
          update: req.body
        });
      }
      
      res.status(200).json(updatedProcess);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Payment routes
  apiRouter.get("/payment/methods", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Return available payment methods
      res.status(200).json([
        {
          id: 'upi',
          name: 'UPI',
          description: 'Pay using UPI (Google Pay, PhonePe, etc.)',
          enabled: true
        },
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Pay using credit or debit card',
          enabled: true
        },
        {
          id: 'netbanking',
          name: 'Net Banking',
          description: 'Pay using net banking',
          enabled: true
        },
        {
          id: 'wallet',
          name: 'Wallet',
          description: 'Pay using Paytm, PhonePe, or other wallets',
          enabled: true
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });
  
  apiRouter.get("/payment/initialize", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const gateway = req.query.gateway || "razorpay";
      
      // In a real app, this would initialize the specified payment gateway
      res.status(200).json({
        initialized: true,
        gateway,
        merchantId: `demo_merchant_${gateway}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize payment gateway" });
    }
  });
  
  apiRouter.post("/payment/create", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { amount, description, referenceId, paymentMethod, metadata } = req.body;
      
      if (!amount || !description || !referenceId) {
        return res.status(400).json({ 
          message: "Missing required fields: amount, description, and referenceId are required" 
        });
      }
      
      // In a real app, this would create a payment in the specified payment gateway
      // and return the payment details including a transaction ID
      const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Return success response
      res.status(200).json({
        success: true,
        transactionId,
        gatewayReference: `gw_ref_${Date.now()}`,
        paymentMethod: paymentMethod || 'upi',
        timestamp: new Date().toISOString(),
        amount,
        status: 'completed'
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process payment",
        errorMessage: "Payment processing failed. Please try again."
      });
    }
  });
  
  apiRouter.get("/payment/verify/:transactionId", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { transactionId } = req.params;
      
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID is required" });
      }
      
      // In a real app, this would verify the payment status with the payment gateway
      // and update the payment status in the database accordingly
      
      // Return verification response (simulating success)
      res.status(200).json({
        success: true,
        transactionId,
        gatewayReference: `gw_ref_${transactionId.split('_')[1]}`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        verificationDetails: {
          verifiedAt: new Date().toISOString(),
          verificationMethod: 'api',
          verificationSource: 'gateway'
        }
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to verify payment",
        errorMessage: "Payment verification failed. Please contact support."
      });
    }
  });
  
  apiRouter.post("/loans/:id/repay", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { id } = req.params;
      const { amount, paymentMethod } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Payment amount is required" });
      }
      
      // In a real app, this would process the loan repayment through a payment gateway
      // and update the loan status in the database accordingly
      const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Return success response
      res.status(200).json({
        success: true,
        loanId: Number(id),
        transactionId,
        paymentMethod: paymentMethod || 'upi',
        timestamp: new Date().toISOString(),
        amount,
        status: 'completed'
      });
    } catch (error) {
      console.error("Loan repayment error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process loan repayment",
        errorMessage: "Loan repayment failed. Please try again."
      });
    }
  });

  // Add all API routes under /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  
  // Initialize WebSocket server on a distinct path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });
  
  // Map to store active connections by user ID and process ID
  const connections = new Map<string, WebSocket[]>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    let userId: string | null = null;
    let processId: string | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        // User subscribes to updates for a specific process
        if (data.type === 'subscribe' && data.userId && data.processId) {
          userId = data.userId.toString();
          processId = data.processId.toString();
          
          // Store connection keyed by userId:processId
          const key = `${userId}:${processId}`;
          if (!connections.has(key)) {
            connections.set(key, []);
          }
          connections.get(key)?.push(ws);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'subscribed',
            processId,
            userId,
            timestamp: new Date().toISOString()
          }));
          
          console.log(`User ${userId} subscribed to process ${processId}`);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });
    
    ws.on('close', () => {
      if (userId && processId) {
        const key = `${userId}:${processId}`;
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
        console.log(`User ${userId} unsubscribed from process ${processId}`);
      }
      console.log('WebSocket client disconnected');
    });
  });
  
  // Helper function to broadcast updates to WebSocket clients
  function broadcastProcessUpdate(userId: number, processId: number, data: any) {
    const key = `${userId}:${processId}`;
    const clients = connections.get(key) || [];
    
    if (clients.length > 0) {
      const message = JSON.stringify({
        type: 'process_update',
        processId,
        ...data,
        timestamp: new Date().toISOString()
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      console.log(`Sent update to ${clients.length} clients for process ${processId}`);
    }
  }
  
  // Make broadcastProcessUpdate available on the global scope
  (global as any).broadcastProcessUpdate = broadcastProcessUpdate;

  return httpServer;
}
