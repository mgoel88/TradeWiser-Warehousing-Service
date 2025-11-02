import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { revolvingCreditAccounts, warehouseReceiptCollateral, creditTransactions, dailyInterestCalculations, warehouseReceipts } from '../../shared/schema';
import { eq, and, sql, desc, isNull, gte } from 'drizzle-orm';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = Router();

console.log('✅ Revolving Credit Router (JWT) loaded successfully');

/**
 * GET /api/revolving-credit/account
 * Get or create the user's revolving credit account with current status
 */
router.get('/account', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get or create revolving credit account
    let account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      // Create new account with default values
      const [newAccount] = await db.insert(revolvingCreditAccounts).values({
        userId,
        totalCreditLimit: 0,
        utilizedAmount: 0,
        availableCredit: 0,
        annualInterestRate: 12.00,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      account = newAccount;
    }
    
    // Get collateral details
    const collateral = await db.query.warehouseReceiptCollateral.findMany({
      where: and(
        eq(warehouseReceiptCollateral.creditAccountId, account.id),
        isNull(warehouseReceiptCollateral.unpledgedAt)
      ),
      with: {
        warehouseReceipt: true
      }
    });
    
    // Calculate summary
    const totalPledgedValue = collateral.reduce((sum, c) => sum + Number(c.pledgedValue), 0);
    const creditUtilization = account.totalCreditLimit > 0 
      ? (Number(account.utilizedAmount) / Number(account.totalCreditLimit)) * 100 
      : 0;
    
    res.json({
      success: true,
      data: {
        account: {
          id: account.id,
          userId: account.userId,
          totalCreditLimit: Number(account.totalCreditLimit),
          utilizedAmount: Number(account.utilizedAmount),
          availableCredit: Number(account.availableCredit),
          annualInterestRate: Number(account.annualInterestRate),
          status: account.status,
          lastInterestCalculationDate: account.lastInterestCalculationDate,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt
        },
        collateral: collateral.map(c => ({
          id: c.id,
          warehouseReceiptId: c.warehouseReceiptId,
          pledgedValue: Number(c.pledgedValue),
          ltvRatio: Number(c.ltvRatio),
          pledgedAt: c.pledgedAt,
          receipt: c.warehouseReceipt
        })),
        summary: {
          totalPledgedValue,
          ltvRatio: 80, // Standard 80% LTV
          creditUtilization: Math.round(creditUtilization)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching revolving credit account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch credit account details' 
    });
  }
});

/**
 * GET /api/revolving-credit/eligible-receipts
 * Get warehouse receipts eligible for use as collateral
 */
router.get('/eligible-receipts', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get all warehouse receipts that are:
    // 1. Owned by the user
    // 2. Status is 'active' (receipt generated and ready for use)
    // 3. Not already pledged
    const eligibleReceipts = await db.query.warehouseReceipts.findMany({
      where: and(
        eq(warehouseReceipts.ownerId, userId),
        eq(warehouseReceipts.status, 'active')
      )
    });
    
    // Filter out already pledged receipts
    const pledgedReceiptIds = await db.query.warehouseReceiptCollateral.findMany({
      where: isNull(warehouseReceiptCollateral.unpledgedAt),
      columns: { warehouseReceiptId: true }
    });
    
    const pledgedIds = new Set(pledgedReceiptIds.map(p => p.warehouseReceiptId));
    const unpledgedReceipts = eligibleReceipts.filter(r => !pledgedIds.has(r.id));
    
    res.json({
      success: true,
      data: {
        receipts: unpledgedReceipts.map(r => ({
          id: r.id,
          commodityType: r.commodityType,
          quantity: Number(r.quantity),
          unit: r.unit,
          estimatedValue: Number(r.estimatedValue),
          receiptNumber: r.receiptNumber,
          storageStartDate: r.storageStartDate,
          warehouseLocation: r.warehouseLocation
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching eligible receipts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch eligible receipts' 
    });
  }
});

/**
 * POST /api/revolving-credit/pledge-collateral
 * Pledge a warehouse receipt as collateral to increase credit limit
 */
router.post('/pledge-collateral', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { warehouseReceiptId } = req.body;
    
    if (!warehouseReceiptId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Warehouse receipt ID is required' 
      });
    }
    
    // Verify receipt exists and belongs to user
    const receipt = await db.query.warehouseReceipts.findFirst({
      where: and(
        eq(warehouseReceipts.id, warehouseReceiptId),
        eq(warehouseReceipts.ownerId, userId)
      )
    });
    
    if (!receipt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Warehouse receipt not found' 
      });
    }
    
    if (receipt.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt is not eligible for pledging. Status must be active.' 
      });
    }
    
    // Check if already pledged
    const existingPledge = await db.query.warehouseReceiptCollateral.findFirst({
      where: and(
        eq(warehouseReceiptCollateral.warehouseReceiptId, warehouseReceiptId),
        isNull(warehouseReceiptCollateral.unpledgedAt)
      )
    });
    
    if (existingPledge) {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt is already pledged' 
      });
    }
    
    // Get or create credit account
    let account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      const [newAccount] = await db.insert(revolvingCreditAccounts).values({
        userId,
        totalCreditLimit: 0,
        utilizedAmount: 0,
        availableCredit: 0,
        annualInterestRate: 12.00,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      account = newAccount;
    }
    
    // Calculate pledged value (80% LTV of estimated value)
    const ltvRatio = 0.80;
    const pledgedValue = Number(receipt.valuation) * ltvRatio;
    
    // Create collateral record
    await db.insert(warehouseReceiptCollateral).values({
      creditAccountId: account.id,
      warehouseReceiptId: receipt.id,
      pledgedAmount: Number(receipt.valuation),
      currentMarketValue: Number(receipt.valuation),
      creditLimit: pledgedValue,
      ltvRatio,
      pledgedAt: new Date()
    });
    
    // Update credit account limits
    const newTotalLimit = Number(account.totalCreditLimit) + pledgedValue;
    const newAvailableCredit = Number(account.availableCredit) + pledgedValue;
    
    await db.update(revolvingCreditAccounts)
      .set({
        totalCreditLimit: newTotalLimit,
        availableCredit: newAvailableCredit,
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    res.json({
      success: true,
      message: 'Collateral pledged successfully',
      data: {
        pledgedValue,
        newTotalLimit,
        newAvailableCredit
      }
    });
    
  } catch (error) {
    console.error('Error pledging collateral:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to pledge collateral' 
    });
  }
});

/**
 * POST /api/revolving-credit/withdraw
 * Withdraw funds from available credit
 */
router.post('/withdraw', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { amount, bankAccountId, purpose } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid withdrawal amount is required' 
      });
    }
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit account not found' 
      });
    }
    
    if (account.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Credit account is not active' 
      });
    }
    
    if (Number(account.availableCredit) < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient available credit' 
      });
    }
    
    // Update account
    const newUtilizedAmount = Number(account.utilizedAmount) + amount;
    const newAvailableCredit = Number(account.availableCredit) - amount;
    
    await db.update(revolvingCreditAccounts)
      .set({
        utilizedAmount: newUtilizedAmount,
        availableCredit: newAvailableCredit,
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    // Record transaction
    await db.insert(creditTransactions).values({
      creditAccountId: account.id,
      transactionType: 'withdrawal',
      amount,
      balanceAfter: newUtilizedAmount,
      transactionDate: new Date(),
      description: purpose || 'Credit withdrawal'
    });
    
    res.json({
      success: true,
      message: 'Withdrawal successful',
      data: {
        amount,
        newUtilizedAmount,
        newAvailableCredit
      }
    });
    
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process withdrawal' 
    });
  }
});

/**
 * POST /api/revolving-credit/repay
 * Repay borrowed amount
 */
router.post('/repay', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid repayment amount is required' 
      });
    }
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit account not found' 
      });
    }
    
    if (Number(account.utilizedAmount) === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No outstanding balance to repay' 
      });
    }
    
    // Calculate repayment (can't repay more than utilized)
    const repaymentAmount = Math.min(amount, Number(account.utilizedAmount));
    
    // Update account
    const newUtilizedAmount = Number(account.utilizedAmount) - repaymentAmount;
    const newAvailableCredit = Number(account.availableCredit) + repaymentAmount;
    
    await db.update(revolvingCreditAccounts)
      .set({
        utilizedAmount: newUtilizedAmount,
        availableCredit: newAvailableCredit,
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    // Record transaction
    await db.insert(creditTransactions).values({
      creditAccountId: account.id,
      transactionType: 'repayment',
      amount: repaymentAmount,
      balanceAfter: newUtilizedAmount,
      transactionDate: new Date(),
      description: `Repayment via ${paymentMethod || 'default method'}`
    });
    
    res.json({
      success: true,
      message: 'Repayment successful',
      data: {
        amount: repaymentAmount,
        newUtilizedAmount,
        newAvailableCredit
      }
    });
    
  } catch (error) {
    console.error('Error processing repayment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process repayment' 
    });
  }
});

/**
 * POST /api/revolving-credit/unpledge-collateral
 * Unpledge a warehouse receipt (only if sufficient credit available without it)
 */
router.post('/unpledge-collateral', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { warehouseReceiptId } = req.body;
    
    if (!warehouseReceiptId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Warehouse receipt ID is required' 
      });
    }
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Credit account not found' 
      });
    }
    
    // Get collateral record
    const collateral = await db.query.warehouseReceiptCollateral.findFirst({
      where: and(
        eq(warehouseReceiptCollateral.creditAccountId, account.id),
        eq(warehouseReceiptCollateral.warehouseReceiptId, warehouseReceiptId),
        isNull(warehouseReceiptCollateral.unpledgedAt)
      )
    });
    
    if (!collateral) {
      return res.status(404).json({ 
        success: false, 
        message: 'Collateral not found or already released' 
      });
    }
    
    // Check if unpledging would make utilized amount exceed new limit
    const newTotalLimit = Number(account.totalCreditLimit) - Number(collateral.pledgedValue);
    
    if (Number(account.utilizedAmount) > newTotalLimit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot unpledge: would exceed credit limit. Please repay first.' 
      });
    }
    
    // Mark collateral as released
    await db.update(warehouseReceiptCollateral)
      .set({ unpledgedAt: new Date() })
      .where(eq(warehouseReceiptCollateral.id, collateral.id));
    
    // Update credit account
    const newAvailableCredit = Number(account.availableCredit) - Number(collateral.pledgedValue);
    
    await db.update(revolvingCreditAccounts)
      .set({
        totalCreditLimit: newTotalLimit,
        availableCredit: newAvailableCredit,
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    res.json({
      success: true,
      message: 'Collateral unpledged successfully',
      data: {
        releasedValue: Number(collateral.pledgedValue),
        newTotalLimit,
        newAvailableCredit
      }
    });
    
  } catch (error) {
    console.error('Error unpledging collateral:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unpledge collateral' 
    });
  }
});

/**
 * GET /api/revolving-credit/transactions
 * Get transaction history with pagination
 */
router.get('/transactions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.json({
        success: true,
        data: {
          transactions: [],
          pagination: { limit, offset, total: 0 }
        }
      });
    }
    
    // Get transactions
    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.creditAccountId, account.id),
      orderBy: [desc(creditTransactions.transactionDate)],
      limit,
      offset
    });
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(creditTransactions)
      .where(eq(creditTransactions.creditAccountId, account.id));
    
    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.transactionType,
          amount: Number(t.amount),
          balanceAfter: Number(t.balanceAfter),
          date: t.transactionDate,
          description: t.description
        })),
        pagination: {
          limit,
          offset,
          total: Number(count)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transactions' 
    });
  }
});

/**
 * GET /api/revolving-credit/interest-history
 * Get interest calculation history
 */
router.get('/interest-history', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.json({
        success: true,
        data: {
          interestHistory: [],
          summary: { totalInterest: 0, days: 0 }
        }
      });
    }
    
    // Get interest calculations
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const interestHistory = await db.query.dailyInterestCalculations.findMany({
      where: and(
        eq(dailyInterestCalculations.creditAccountId, account.id),
        gte(dailyInterestCalculations.calculationDate, cutoffDate)
      ),
      orderBy: [desc(dailyInterestCalculations.calculationDate)]
    });
    
    const totalInterest = interestHistory.reduce(
      (sum, calc) => sum + Number(calc.dailyInterestAmount), 
      0
    );
    
    res.json({
      success: true,
      data: {
        interestHistory: interestHistory.map(calc => ({
          date: calc.calculationDate,
          outstandingBalance: Number(calc.outstandingBalance),
          dailyInterest: Number(calc.dailyInterestAmount),
          annualRate: Number(calc.annualRate)
        })),
        summary: {
          totalInterest,
          days: interestHistory.length
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching interest history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch interest history' 
    });
  }
});

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Revolving credit router (JWT) is working!', 
    timestamp: new Date().toISOString() 
  });
});

export default router;
