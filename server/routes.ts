import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from "./storage";
import { 
  insertUserSchema, insertWarehouseSchema, insertCommoditySchema, insertWarehouseReceiptSchema, 
  insertLoanSchema, insertProcessSchema, insertCommoditySackSchema, insertSackMovementSchema, 
  insertSackQualityAssessmentSchema, InsertCommoditySack, InsertSackMovement, InsertSackQualityAssessment
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import 'express-session';
import { paymentService, PaymentMethod, PaymentStatus } from './services/PaymentService';
import documentParsingService from './services/DocumentParsingService';
import fileUploadService from './services/FileUploadService';
import externalWarehouseService from './services/ExternalWarehouseService';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

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
  
  // Generate QR code for receipt verification
  apiRouter.get("/receipts/:id/qr-code", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid receipt ID" });
      }
      
      // Get the receipt
      const receipts = await storage.listWarehouseReceipts();
      const receipt = receipts.find(r => r.id === id);
      
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      
      // Note: We've removed the authentication check to allow the QR code to be publicly accessible
      // In a production system, you would want to add more security measures like rate limiting
      
      // Get the verification code from the liens field
      let verificationCode;
      if (receipt.liens && typeof receipt.liens === 'object') {
        const liens = receipt.liens as Record<string, any>;
        verificationCode = liens.verificationCode;
      }
      
      // If no verification code exists, generate one and update the receipt
      if (!verificationCode) {
        // Generate a unique verification code: combination of receipt ID, current timestamp, and a random string
        verificationCode = `R${id}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        
        // Update the receipt with the verification code
        const liens = receipt.liens && typeof receipt.liens === 'object' 
          ? { ...(receipt.liens as Record<string, any>), verificationCode } 
          : { verificationCode };
          
        await storage.updateWarehouseReceipt(id, { liens });
      }
      
      // Build the verification URL
      const verificationUrl = `${req.protocol}://${req.get('host')}/verify-receipt/${verificationCode}`;
      
      // Return the verification URL and code for QR generation on client
      res.status(200).json({
        receiptId: id,
        verificationCode,
        verificationUrl
      });
    } catch (error) {
      console.error("QR code generation error:", error);
      res.status(500).json({ message: "Server error generating QR code" });
    }
  });
  
  // Serve receipt attachments
  apiRouter.get("/receipts/attachments/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      // Import file upload service to get the path to the attachment
      const fileUploadService = await import('./services/FileUploadService');
      
      // Get the path to the attachment file
      const attachmentPath = fileUploadService.default.getAttachmentPath(filename);
      
      // Check if the file exists
      if (!fs.existsSync(attachmentPath)) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream'; // Default
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.csv') contentType = 'text/csv';
      else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      // Set content type and send the file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the file to the response
      fs.createReadStream(attachmentPath).pipe(res);
    } catch (error) {
      console.error("Error serving attachment:", error);
      res.status(500).json({ 
        message: "Error serving attachment: " + (error instanceof Error ? error.message : String(error)) 
      });
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

  // Upload receipt file for Orange Channel - using OCR and document parsing
  apiRouter.post("/receipts/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sourceType = req.body.sourceType || 'other';
      
      // Save the uploaded file to disk
      const savedFile = await fileUploadService.handleReceiptUpload(req.file);
      
      // Process the file using document parsing service
      const result = await documentParsingService.processUploadedFile(
        savedFile.filePath, 
        savedFile.fileType, 
        req.session.userId,
        sourceType
      );
      
      // Clean up the file after processing
      await fileUploadService.deleteFile(savedFile.filePath);
      
      res.status(200).json({
        message: result.message,
        receipts: result.receipts
      });
    } catch (error) {
      console.error("Error processing uploaded receipt:", error);
      res.status(500).json({ 
        message: "Error processing receipt: " + (error instanceof Error ? error.message : String(error)) 
      });
    }
  });

  // Orange Channel - Manual receipt entry
  apiRouter.post("/receipts/manual", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { 
        receiptNumber, 
        warehouseName, 
        warehouseAddress,
        warehouseLocation, 
        commodityName, 
        quantity, 
        qualityGrade, 
        issuedDate, 
        expiryDate, 
        externalId, 
        externalSource, 
        channelType,
        location, // For Red Channel (self-storage location)
        measurementUnit,
        valuation,
        description,
        metadata
      } = req.body;
      
      // Special handling for Red Channel (self-certified)
      const isRedChannel = channelType === 'red' || (metadata && metadata.isSelfCertified);
      
      // Different validation based on channel type
      if (isRedChannel) {
        // For Red Channel: only need receiptNumber, commodityName, quantity, and location
        if (!receiptNumber || !commodityName || !quantity || !location) {
          return res.status(400).json({ 
            message: "Missing required fields: receiptNumber, commodityName, quantity, and location are required for self-certification" 
          });
        }
      } else {
        // For Orange Channel: need receiptNumber, warehouseName, commodityName, quantity
        if (!receiptNumber || !commodityName || !quantity) {
          return res.status(400).json({ 
            message: "Missing required fields: receiptNumber, commodityName, and quantity are required" 
          });
        }
      }
      
      // Check if receipt with same external ID exists
      if (externalId && externalSource) {
        const existingReceipt = await storage.getWarehouseReceiptByExternalId(externalId, externalSource);
        if (existingReceipt) {
          return res.status(409).json({ 
            message: "A receipt with this external ID already exists", 
            receiptId: existingReceipt.id 
          });
        }
      }
      
      // Import document parsing service to use its receipt number formatting and smart contract generation
      const documentParsingService = await import('./services/DocumentParsingService');
      
      // Format the receipt number in credit card style
      const formattedReceiptNumber = documentParsingService.default.formatReceiptNumber(
        receiptNumber, 
        req.session.userId
      );
      
      // Generate a smart contract ID for the receipt
      const smartContractId = documentParsingService.default.generateSmartContractId(
        formattedReceiptNumber, 
        req.session.userId
      );
      
      // Determine storage location based on channel type
      const storageLocation = isRedChannel ? location : warehouseLocation;
      
      // Prepare metadata based on channel type
      const receiptMetadata = isRedChannel
        ? {
            isSelfCertified: true,
            certificationDate: new Date().toISOString(),
            storageLocation: location,
            channelType: 'red',
            description: description || '',
            ...(metadata || {})
          }
        : {
            isExternal: true,
            channelType: channelType || 'orange',
            sourceType: externalSource || 'manual',
            processingDate: new Date().toISOString(),
            manuallyCreated: true,
            ...(metadata || {})
          };
          
      // Create the receipt with appropriate channel-specific data
      const receipt = await storage.createWarehouseReceipt({
        receiptNumber: formattedReceiptNumber,
        warehouseName: isRedChannel ? 'Self-Certified Storage' : (warehouseName || 'External Warehouse'),
        warehouseAddress: isRedChannel ? location : (warehouseAddress || warehouseLocation || 'External Location'),
        commodityName,
        quantity: quantity.toString(),
        qualityGrade: qualityGrade || 'Standard',
        measurementUnit: measurementUnit || 'MT',
        status: "active",
        ownerId: req.session.userId,
        externalId: externalId || formattedReceiptNumber,
        externalSource: isRedChannel ? 'self-certified' : (externalSource || 'manual'),
        smartContractId,
        valuation: valuation || null,
        attachmentUrl: null,
        metadata: receiptMetadata
      });
      
      const successMessage = isRedChannel 
        ? "Self-certified receipt created successfully" 
        : "External receipt created successfully";
        
      res.status(201).json({
        message: successMessage,
        receipt
      });
    } catch (error) {
      console.error("Error creating manual receipt:", error);
      res.status(500).json({ 
        message: "Error creating receipt: " + (error instanceof Error ? error.message : String(error)) 
      });
    }
  });

  // Withdrawal routes
  apiRouter.post("/receipts/:id/withdraw", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const receiptId = parseInt(req.params.id);
      if (isNaN(receiptId)) {
        return res.status(400).json({ message: "Invalid receipt ID" });
      }
      
      // Get the optional quantity parameter for partial withdrawals
      const { quantity } = req.body;
      
      // Import withdrawal service dynamically to avoid circular dependencies
      const { withdrawalService } = await import('./services/WithdrawalService');
      
      // Initiate the withdrawal process
      const result = await withdrawalService.initiateWithdrawal(receiptId, req.session.userId, quantity);
      
      res.status(200).json({ 
        message: result.isFullWithdrawal ? 
          "Full withdrawal initiated" : 
          `Partial withdrawal of ${quantity} initiated`,
        process: result.process,
        receipt: result.receipt
      });
    } catch (error) {
      console.error("Withdrawal initiation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Server error during withdrawal";
      const statusCode = errorMessage.includes("Not authorized") ? 403 : 500;
      res.status(statusCode).json({ message: errorMessage });
    }
  });
  
  /**
   * Helper function to calculate progress based on the stage
   * @param stage The current process stage
   * @returns A number between 0-100 representing the progress percentage
   */
  function calculateProgressFromStage(stage: string): number {
    // Define the withdrawal stages and their progress values
    const stageProgressMap: Record<string, number> = {
      "verification": 10,
      "preparation": 25,
      "document_check": 40,
      "physical_release": 60,
      "quantity_confirmation": 80,
      "receipt_update": 95
    };
    
    return stageProgressMap[stage] || 50; // Default to 50% if stage not found
  }
  
  apiRouter.post("/processes/:id/withdrawal-update", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const processId = parseInt(req.params.id);
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Validate the update data
      const { stage, status, message } = req.body;
      
      if (!stage || !status) {
        return res.status(400).json({ 
          message: "Missing required fields: stage and status are required" 
        });
      }
      
      // Import withdrawal service dynamically to avoid circular dependencies
      const { withdrawalService } = await import('./services/WithdrawalService');
      
      // Update the withdrawal process stage
      const result = await withdrawalService.updateWithdrawalStage(processId, stage, status, message);
      
      // Broadcast the process update to all clients
      if (wss) {
        // Extract progress from result if available
        // The updateWithdrawalStage method returns { process, progress, message }
        // where progress is a number between 0-100
        const progressValue = result && typeof result.progress === 'number' 
          ? result.progress 
          : calculateProgressFromStage(stage);
        
        broadcastProcessUpdate(req.session.userId, processId, {
          message: message || `Stage ${stage} set to ${status}`,
          stage,
          status,
          progress: progressValue
        });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Withdrawal update error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Server error during withdrawal update" 
      });
    }
  });
  
  apiRouter.post("/processes/:id/complete-withdrawal", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const processId = parseInt(req.params.id);
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Import withdrawal service dynamically to avoid circular dependencies
      const { withdrawalService } = await import('./services/WithdrawalService');
      
      // Complete the withdrawal process
      const result = await withdrawalService.completeWithdrawal(processId);
      
      // Broadcast the process update to all clients
      if (wss) {
        broadcastProcessUpdate(req.session.userId, processId, {
          message: "Withdrawal completed successfully",
          stage: "receipt_update",
          status: "completed",
          progress: 100
        });
      }
      
      res.status(200).json({ 
        message: "Withdrawal completed successfully", 
        ...result
      });
    } catch (error) {
      console.error("Withdrawal completion error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Server error completing withdrawal" 
      });
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
  
  apiRouter.get("/receipts/available-collateral", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get all active receipts owned by the user
      const receipts = await storage.listUserReceipts(req.session.userId);
      
      // Filter for active receipts that aren't already used as collateral
      const availableCollateral = receipts.filter(receipt => {
        return (
          receipt.status === 'active' && 
          (!receipt.liens || Object.keys(receipt.liens || {}).length === 0)
        );
      });
      
      // Calculate current market values and lending limits
      const collateralWithValues = await Promise.all(
        availableCollateral.map(async (receipt) => {
          // Commodity market price could come from an external API
          // For demo, we'll use the valuation stored or compute a fixed value
          const marketValue = receipt.valuation || 
            parseFloat(receipt.quantity) * (receipt.commodityName === 'wheat' ? 2200 : 
              receipt.commodityName === 'rice' ? 3500 : 
              receipt.commodityName === 'maize' ? 1800 : 2500);
              
          // Calculate the max lending value (80% of market value)
          const maxLendingValue = marketValue * 0.8;
          
          return {
            ...receipt,
            marketValue,
            maxLendingValue,
            commodityType: receipt.commodityName || 'Unknown',
            warehouseName: receipt.warehouseName || `Warehouse #${receipt.warehouseId}`,
            collateralValuePercentage: 80,
            loanToValueRatio: 0.8
          };
        })
      );
      
      res.status(200).json(collateralWithValues);
    } catch (error) {
      console.error("Error fetching available collateral:", error);
      res.status(500).json({ message: "Failed to fetch available collateral" });
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
  
  // Create an overdraft-style loan facility
  apiRouter.post("/loans/overdraft", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { receiptIds, withdrawAmount } = req.body;
      
      if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
        return res.status(400).json({ message: "At least one receipt ID is required for collateral" });
      }
      
      // Get all the receipts to calculate the collateral value
      const receiptPromises = receiptIds.map(id => storage.getWarehouseReceipt(parseInt(id)));
      const receipts = await Promise.all(receiptPromises);
      
      // Filter out any non-existent receipts and verify ownership
      const validReceipts = receipts.filter(receipt => 
        receipt && receipt.ownerId === req.session.userId && receipt.status === 'active'
      );
      
      if (validReceipts.length === 0) {
        return res.status(400).json({ message: "No valid receipts found for collateral" });
      }
      
      // Calculate total collateral value
      const totalCollateralValue = validReceipts.reduce((sum, receipt) => {
        // Use valuation or calculate based on quantity and commodity type
        const value = receipt.valuation || 
          parseFloat(receipt.quantity) * (receipt.commodityName === 'wheat' ? 2200 : 
            receipt.commodityName === 'rice' ? 3500 : 
            receipt.commodityName === 'maize' ? 1800 : 2500);
        return sum + value;
      }, 0);
      
      // Calculate maximum lending value (80% of collateral)
      const maxLendingValue = totalCollateralValue * 0.8;
      
      // Validate withdrawal amount if specified
      let initialDrawdown = 0;
      if (withdrawAmount) {
        initialDrawdown = parseFloat(withdrawAmount);
        if (isNaN(initialDrawdown) || initialDrawdown <= 0) {
          return res.status(400).json({ message: "Invalid withdrawal amount" });
        }
        
        if (initialDrawdown > maxLendingValue) {
          return res.status(400).json({ 
            message: `Withdrawal amount exceeds maximum lending value of ${maxLendingValue}` 
          });
        }
      }
      
      // Current date for loan start
      const startDate = new Date();
      
      // Set loan end date to 6 months from now
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      
      // Create the loan with overdraft facility
      const loanData = {
        userId: req.session.userId,
        amount: maxLendingValue.toString(), // Maximum overdraft limit
        outstandingAmount: initialDrawdown.toString(), // Initial drawdown amount
        interestRate: "12.5", // Fixed interest rate
        startDate: startDate,
        endDate: endDate,
        status: 'active' as const,
        collateralReceiptIds: receiptIds,
        repaymentSchedule: {
          type: "overdraft",
          interestCalculation: "daily",
          facilityType: "revolving",
          interestOnlyOnUtilized: true
        }
      };
      
      // Create loan in storage
      const loan = await storage.createLoan(loanData);
      
      // Update the receipts to mark them as collateralized
      for (const receipt of validReceipts) {
        const liens = receipt.liens || {};
        liens[`loan_${loan.id}`] = {
          loanId: loan.id,
          timestamp: new Date().toISOString(),
          amount: maxLendingValue,
          type: "overdraft_collateral"
        };
        
        await storage.updateWarehouseReceipt(receipt.id, {
          status: 'collateralized',
          liens
        });
      }
      
      // Generate blockchain record for the loan collateral if needed
      // (this would typically be handled by BlockchainService)
      
      // Response includes blockchain verification data for visualization
      res.status(201).json({
        loan,
        collateralValue: totalCollateralValue,
        maxLendingValue,
        initialDrawdown,
        availableCredit: maxLendingValue - initialDrawdown,
        receiptsUsed: validReceipts.length,
        blockchainVerification: {
          timestamp: new Date().toISOString(),
          hash: `0x${Math.random().toString(16).substring(2, 34)}${Date.now().toString(16)}`,
          confirmed: true
        }
      });
    } catch (error) {
      console.error("Error creating overdraft loan:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Server error" 
        });
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
      
      // Use our PaymentService to get available payment methods
      const paymentMethods = paymentService.getPaymentMethods();
      
      res.status(200).json(paymentMethods);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });
  
  apiRouter.get("/payment/history", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get payment history for the current user
      const payments = paymentService.getUserPayments(req.session.userId);
      
      res.status(200).json(payments);
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  
  apiRouter.post("/payment/create", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { amount, description, referenceId, paymentMethod, metadata } = req.body;
      
      if (!amount || !description) {
        return res.status(400).json({ 
          message: "Missing required fields: amount and description are required" 
        });
      }
      
      // Use our PaymentService to create a payment
      const payment = await paymentService.createPayment(
        req.session.userId,
        amount,
        description,
        paymentMethod as PaymentMethod,
        referenceId,
        metadata
      );
      
      // Return payment details
      res.status(200).json({
        success: true,
        payment
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
  
  apiRouter.get("/payment/verify/:paymentId", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }
      
      // Use our PaymentService to verify the payment
      const verification = paymentService.verifyPayment(paymentId);
      
      res.status(200).json({
        success: verification.verified,
        status: verification.status,
        details: verification.details,
        verified: verification.verified,
        timestamp: new Date().toISOString()
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
      
      // Check if loan exists and belongs to the user
      const loan = await storage.getLoan(parseInt(id));
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      if (loan.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to repay this loan" });
      }
      
      // Use our PaymentService to process loan repayment
      const result = await paymentService.processLoanRepayment(
        req.session.userId,
        parseInt(id),
        amount,
        paymentMethod as PaymentMethod
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          loanId: parseInt(id),
          payment: result.payment,
          message: "Loan repayment processed successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          loanId: parseInt(id),
          payment: result.payment,
          message: "Loan repayment failed"
        });
      }
    } catch (error) {
      console.error("Loan repayment error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process loan repayment",
        errorMessage: "Loan repayment failed. Please try again."
      });
    }
  });
  
  // New endpoint for warehouse storage fees payment
  apiRouter.post("/warehouses/:id/pay-fees", async (req: Request, res: Response) => {
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
      
      // Check if warehouse exists
      const warehouse = await storage.getWarehouse(parseInt(id));
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      // Use our PaymentService to process warehouse fee payment
      const result = await paymentService.payWarehouseFees(
        req.session.userId,
        parseInt(id),
        amount,
        paymentMethod as PaymentMethod
      );
      
      if (result.success) {
        res.status(200).json({
          success: true,
          warehouseId: parseInt(id),
          payment: result.payment,
          message: "Warehouse storage fees paid successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          warehouseId: parseInt(id),
          payment: result.payment,
          message: "Warehouse fee payment failed"
        });
      }
    } catch (error) {
      console.error("Warehouse fee payment error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process storage fee payment",
        errorMessage: "Payment failed. Please try again."
      });
    }
  });

  // Smart Contract Routes
apiRouter.post("/smart-contracts/lien", async (req: Request, res: Response) => {
  try {
    const { loanId, receiptIds, amount } = req.body;
    const contractId = await SmartContractService.createLienContract(loanId, receiptIds, amount);
    res.status(201).json({ contractId });
  } catch (error) {
    res.status(500).json({ message: "Failed to create lien contract" });
  }
});

apiRouter.post("/smart-contracts/repayment", async (req: Request, res: Response) => {
  try {
    const { loanId, amount, schedule } = req.body;
    const contractId = await SmartContractService.createRepaymentContract(loanId, amount, schedule);
    res.status(201).json({ contractId });
  } catch (error) {
    res.status(500).json({ message: "Failed to create repayment contract" });
  }
});

apiRouter.post("/smart-contracts/escrow", async (req: Request, res: Response) => {
  try {
    const { commodityId, sellerId, buyerId, amount, conditions } = req.body;
    const contractId = await SmartContractService.createEscrowContract(
      commodityId, sellerId, buyerId, amount, conditions
    );
    res.status(201).json({ contractId });
  } catch (error) {
    res.status(500).json({ message: "Failed to create escrow contract" });
  }
});

apiRouter.post("/smart-contracts/:id/execute", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await SmartContractService.executeContract(id);
    if (success) {
      res.status(200).json({ message: "Contract executed successfully" });
    } else {
      res.status(400).json({ message: "Failed to execute contract" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error executing contract" });
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
  
  // Map to store active connections by user ID, entity type, and entity ID
  const connections = new Map<string, WebSocket[]>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    // Track subscriptions for this connection
    const subscriptions: {userId: string, entityType: string, entityId: string}[] = [];
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle subscription requests
        if (data.type === 'subscribe' && data.userId) {
          const userId = data.userId.toString();
          
          // Handle process-specific subscriptions for backward compatibility
          if (data.processId) {
            const processId = data.processId.toString();
            const entityType = 'process';
            addSubscription(ws, userId, entityType, processId, subscriptions);
          }
          // Handle new entity-based subscriptions
          else if (data.entityType && data.entityId) {
            const entityType = data.entityType.toString();
            const entityId = data.entityId.toString();
            addSubscription(ws, userId, entityType, entityId, subscriptions);
          }
        }
        // Handle unsubscribe requests
        else if (data.type === 'unsubscribe' && data.userId) {
          const userId = data.userId.toString();
          
          if (data.entityType && data.entityId) {
            const entityType = data.entityType.toString(); 
            const entityId = data.entityId.toString();
            removeSubscription(ws, userId, entityType, entityId, subscriptions);
          }
          // Handle process-specific unsubscribe for backward compatibility
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
      // Clean up all subscriptions for this connection
      subscriptions.forEach(sub => {
        const key = `${sub.userId}:${sub.entityType}:${sub.entityId}`;
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
        
        console.log(`User ${sub.userId} unsubscribed from ${sub.entityType} ${sub.entityId}`);
      });
      
      console.log('WebSocket client disconnected');
    });
    
    // Helper function to add a subscription
    function addSubscription(
      ws: WebSocket,
      userId: string,
      entityType: string,
      entityId: string,
      subscriptions: {userId: string, entityType: string, entityId: string}[]
    ) {
      // Store connection keyed by userId:entityType:entityId
      const key = `${userId}:${entityType}:${entityId}`;
      
      if (!connections.has(key)) {
        connections.set(key, []);
      }
      
      if (!connections.get(key)?.includes(ws)) {
        connections.get(key)?.push(ws);
      }
      
      // Add to this connection's subscriptions
      const existingSubscription = subscriptions.find(
        s => s.userId === userId && s.entityType === entityType && s.entityId === entityId
      );
      
      if (!existingSubscription) {
        subscriptions.push({ userId, entityType, entityId });
      }
      
      // Send confirmation
      ws.send(JSON.stringify({
        type: 'subscribed',
        entityType,
        entityId,
        userId,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`User ${userId} subscribed to ${entityType} ${entityId}`);
    }
    
    // Helper function to remove a subscription
    function removeSubscription(
      ws: WebSocket,
      userId: string,
      entityType: string,
      entityId: string,
      subscriptions: {userId: string, entityType: string, entityId: string}[]
    ) {
      const key = `${userId}:${entityType}:${entityId}`;
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
      
      // Remove from this connection's subscriptions
      const subIndex = subscriptions.findIndex(
        s => s.userId === userId && s.entityType === entityType && s.entityId === entityId
      );
      
      if (subIndex !== -1) {
        subscriptions.splice(subIndex, 1);
      }
      
      console.log(`User ${userId} unsubscribed from ${entityType} ${entityId}`);
    }
  });
  
  // Helper function to broadcast entity updates to WebSocket clients
  function broadcastEntityUpdate(userId: number, entityType: string, entityId: number, data: any) {
    const key = `${userId}:${entityType}:${entityId}`;
    const clients = connections.get(key) || [];
    
    if (clients.length > 0) {
      const message = JSON.stringify({
        type: `${entityType}_update`,
        entityType,
        entityId,
        ...data,
        timestamp: new Date().toISOString()
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      console.log(`Sent ${entityType} update to ${clients.length} clients for ${entityType} ${entityId}`);
    }
  }
  
  // For backward compatibility
  function broadcastProcessUpdate(userId: number, processId: number, data: any) {
    return broadcastEntityUpdate(userId, 'process', processId, data);
  }
  
  // Make broadcast functions available on the global scope
  (global as any).broadcastProcessUpdate = broadcastProcessUpdate;
  (global as any).broadcastEntityUpdate = broadcastEntityUpdate;

  // Commodity Sack routes for granular blockchain tracking
  apiRouter.get("/commodity-sacks", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Filter parameters
      const receiptId = req.query.receiptId ? parseInt(req.query.receiptId as string) : undefined;
      const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId as string) : undefined;
      
      let sacks;
      if (receiptId) {
        sacks = await storage.listCommoditySacksByReceipt(receiptId);
      } else if (warehouseId) {
        sacks = await storage.listCommoditySacksByWarehouse(warehouseId);
      } else {
        // Default to returning user's own sacks
        sacks = await storage.listCommoditySacksByOwner(req.session.userId);
      }
      
      res.json(sacks);
    } catch (error: any) {
      console.error("Error fetching commodity sacks:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.get("/commodity-sacks/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const sackId = parseInt(req.params.id);
      const sack = await storage.getCommoditySack(sackId);
      
      if (!sack) {
        res.status(404).json({ error: "Commodity sack not found" });
        return;
      }
      
      res.json(sack);
    } catch (error: any) {
      console.error("Error fetching commodity sack:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.get("/commodity-sacks/scan/:sackId", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const sackIdString = req.params.sackId;
      const sack = await storage.getCommoditySackBySackId(sackIdString);
      
      if (!sack) {
        res.status(404).json({ error: "Commodity sack not found with given sack ID" });
        return;
      }
      
      res.json(sack);
    } catch (error: any) {
      console.error("Error fetching commodity sack by sack ID:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.post("/commodity-sacks", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.session.userId;
      const result = insertCommoditySackSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
      }
      
      // Make sure the owner is set to the current user
      const sackData = {
        ...result.data,
        ownerId: result.data.ownerId || userId
      };
      
      const sack = await storage.createCommoditySack(sackData);
      res.status(201).json(sack);
    } catch (error: any) {
      console.error("Error creating commodity sack:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.post("/commodity-sacks/batch", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.session.userId;
      const { receiptId, count, weightPerSack = 50, ...commonData } = req.body;
      
      if (!receiptId || !count || count <= 0 || count > 1000) {
        res.status(400).json({ error: "Invalid request. Count must be between 1 and 1000" });
        return;
      }
      
      // Get the receipt to associate sacks with
      const receipt = await storage.getWarehouseReceipt(receiptId);
      if (!receipt) {
        res.status(404).json({ error: "Warehouse receipt not found" });
        return;
      }
      
      // Check if user owns the receipt
      if (receipt.ownerId !== userId) {
        res.status(403).json({ error: "You can only create sacks for receipts you own" });
        return;
      }
      
      // Create batch of sacks
      const sacks: InsertCommoditySack[] = [];
      for (let i = 0; i < count; i++) {
        // Generate unique sack ID with format: SC-{receiptId}-{timestamp}-{index}
        const timestamp = Date.now().toString(36);
        const sackId = `SC-${receiptId}-${timestamp}-${i+1}`;
        
        sacks.push({
          sackId,
          receiptId,
          commodityId: receipt.commodityId,
          weight: weightPerSack,
          measurementUnit: 'kg',
          ownerId: userId,
          warehouseId: receipt.warehouseId,
          barcodeData: sackId,
          status: 'active',
          ...(commonData || {})
        });
      }
      
      const createdSacks = await storage.createManyCommoditySacks(sacks);
      res.status(201).json({ 
        message: `Created ${createdSacks.length} commodity sacks`,
        count: createdSacks.length,
        sacks: createdSacks
      });
    } catch (error: any) {
      console.error("Error creating batch of commodity sacks:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.post("/commodity-sacks/:id/transfer", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.session.userId;
      const sackId = parseInt(req.params.id);
      const { toUserId, toWarehouseId, transferNotes } = req.body;
      
      if (!toUserId && !toWarehouseId) {
        res.status(400).json({ error: "Either toUserId or toWarehouseId must be provided" });
        return;
      }
      
      // Get the sack
      const sack = await storage.getCommoditySack(sackId);
      if (!sack) {
        res.status(404).json({ error: "Commodity sack not found" });
        return;
      }
      
      // Check if user owns the sack
      if (sack.ownerId !== userId) {
        res.status(403).json({ error: "You can only transfer sacks you own" });
        return;
      }
      
      // Prepare transfer data
      const movementType = toUserId ? 'ownership_transfer' : 'warehouse_transfer';
      const movement: InsertSackMovement = {
        sackId,
        fromLocationId: sack.warehouseId,
        toLocationId: toWarehouseId || sack.warehouseId,
        fromOwnerId: userId,
        toOwnerId: toUserId || userId,
        movementType,
        metadata: { notes: transferNotes }
      };
      
      // Create blockchain transaction for the transfer
      const { generateBlockchainTransaction } = await import("./services/BlockchainService");
      const transactionData = {
        sackId: sack.sackId,
        fromUserId: userId,
        toUserId: toUserId || userId,
        fromWarehouseId: sack.warehouseId,
        toWarehouseId: toWarehouseId || sack.warehouseId,
        timestamp: new Date().toISOString(),
        type: movementType
      };
      
      const transactionHash = await generateBlockchainTransaction(transactionData);
      movement.transactionHash = transactionHash;
      
      // Record the movement
      const createdMovement = await storage.createSackMovement(movement);
      
      // Update the sack with new owner or warehouse
      const updateData: Partial<InsertCommoditySack> = { 
        lastUpdated: new Date(),
        blockchainHash: transactionHash 
      };
      
      if (toUserId) {
        updateData.ownerId = toUserId;
      }
      
      if (toWarehouseId) {
        updateData.warehouseId = toWarehouseId;
      }
      
      const updatedSack = await storage.updateCommoditySack(sackId, updateData);
      
      // Broadcast the update via WebSocket
      const broadcastUpdate = (global as any).broadcastEntityUpdate;
      if (typeof broadcastUpdate === 'function') {
        broadcastUpdate('commodity_sack', updatedSack);
      }
      
      res.json({
        movement: createdMovement,
        sack: updatedSack,
        transactionHash
      });
    } catch (error: any) {
      console.error("Error transferring commodity sack:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.post("/commodity-sacks/:id/quality-assessment", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.session.userId;
      const sackId = parseInt(req.params.id);
      const { qualityParameters, gradeAssigned, notes, attachmentUrls } = req.body;
      
      if (!qualityParameters) {
        res.status(400).json({ error: "Quality parameters are required" });
        return;
      }
      
      // Get the sack
      const sack = await storage.getCommoditySack(sackId);
      if (!sack) {
        res.status(404).json({ error: "Commodity sack not found" });
        return;
      }
      
      // Prepare assessment data
      const assessment: InsertSackQualityAssessment = {
        sackId,
        inspectorId: userId,
        qualityParameters,
        gradeAssigned,
        notes,
        attachmentUrls: attachmentUrls || []
      };
      
      // Create blockchain entry for the quality assessment
      const { generateBlockchainTransaction } = await import("./services/BlockchainService");
      const transactionData = {
        sackId: sack.sackId,
        inspectorId: userId,
        qualityParameters,
        gradeAssigned,
        timestamp: new Date().toISOString(),
        type: 'quality_assessment'
      };
      
      const transactionHash = await generateBlockchainTransaction(transactionData);
      assessment.blockchainHash = transactionHash;
      
      // Record the assessment
      const createdAssessment = await storage.createSackQualityAssessment(assessment);
      
      // Update the sack with new quality info
      const updateData: Partial<InsertCommoditySack> = { 
        qualityParameters,
        gradeAssigned,
        lastInspectionDate: new Date(),
        lastUpdated: new Date(),
        blockchainHash: transactionHash 
      };
      
      const updatedSack = await storage.updateCommoditySack(sackId, updateData);
      
      // Broadcast the update via WebSocket
      const broadcastUpdate = (global as any).broadcastEntityUpdate;
      if (typeof broadcastUpdate === 'function') {
        broadcastUpdate('commodity_sack', updatedSack);
      }
      
      res.json({
        assessment: createdAssessment,
        sack: updatedSack,
        transactionHash
      });
    } catch (error: any) {
      console.error("Error creating quality assessment:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.get("/commodity-sacks/:id/movements", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const sackId = parseInt(req.params.id);
      
      // Get movement history
      const movements = await storage.getSackMovementHistory(sackId);
      
      res.json(movements);
    } catch (error: any) {
      console.error("Error fetching sack movements:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  apiRouter.get("/commodity-sacks/:id/quality-history", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const sackId = parseInt(req.params.id);
      
      // Get quality assessment history
      const assessments = await storage.listSackQualityAssessments(sackId);
      
      res.json(assessments);
    } catch (error: any) {
      console.error("Error fetching quality history:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
