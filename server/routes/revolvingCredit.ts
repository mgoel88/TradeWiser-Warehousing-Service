import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  revolvingCreditAccounts, 
  creditTransactions, 
  dailyInterestCalculations,
  commodityPriceUpdates,
  warehouseReceiptCollateral,
  warehouseReceipts
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

console.log('✅ Revolving Credit Router loaded successfully');

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  console.log('🔐 Auth check - Session:', req.session);
  console.log('🔐 Auth check - userId:', req.session?.userId);
  if (!req.session?.userId) {
    console.log('❌ Auth failed - no userId in session');
    return res.status(401).json({ message: "Not authenticated" });
  }
  console.log('✅ Auth successful - userId:', req.session.userId);
  next();
};

// Constants
const LTV_RATIO = 0.80; // 80% Loan-to-Value
const ANNUAL_INTEREST_RATE = 0.12; // 12% annual interest
const DAILY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 365;

/**
 * GET /api/revolving-credit/account
 * Get or create the user's revolving credit account with current status
 */
router.get('/account', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔍 Fetching revolving credit account...');
    const userId = req.session!.userId as number;
    console.log('👤 User ID:', userId);
    
    // Get or create revolving credit account
    let account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      // Create new account with zero limits
      const [newAccount] = await db.insert(revolvingCreditAccounts).values({
        userId,
        totalCreditLimit: '0',
        utilizedAmount: '0',
        availableCredit: '0',
        annualInterestRate: ANNUAL_INTEREST_RATE.toString(),
        status: 'active',
        lastInterestCalculationDate: new Date()
      }).returning();
      
      account = newAccount;
    }
    
    // Get all collateralized warehouse receipts
    const collateralReceipts = await db.query.warehouseReceiptCollateral.findMany({
      where: eq(warehouseReceiptCollateral.creditAccountId, account.id),
      with: {
        warehouseReceipt: true
      }
    });
    
    // Get recent transactions
    const recentTransactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.creditAccountId, account.id),
      orderBy: [desc(creditTransactions.transactionDate)],
      limit: 10
    });
    
    // Get recent interest calculations
    const recentInterest = await db.query.dailyInterestCalculations.findMany({
      where: eq(dailyInterestCalculations.creditAccountId, account.id),
      orderBy: [desc(dailyInterestCalculations.calculationDate)],
      limit: 30
    });
    
    res.json({
      success: true,
      account: {
        id: account.id,
        totalCreditLimit: parseFloat(account.totalCreditLimit),
        utilizedAmount: parseFloat(account.utilizedAmount),
        availableCredit: parseFloat(account.availableCredit),
        annualInterestRate: parseFloat(account.annualInterestRate),
        status: account.status,
        lastInterestCalculationDate: account.lastInterestCalculationDate,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      },
      collateralReceipts: collateralReceipts.map(cr => ({
        id: cr.id,
        warehouseReceiptId: cr.warehouseReceiptId,
        pledgedAmount: parseFloat(cr.pledgedAmount),
        currentMarketValue: parseFloat(cr.currentMarketValue),
        creditLimit: parseFloat(cr.creditLimit),
        isPledged: cr.isPledged,
        pledgedAt: cr.pledgedAt,
        receipt: cr.warehouseReceipt
      })),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.transactionType,
        amount: parseFloat(tx.amount),
        balanceAfter: parseFloat(tx.balanceAfter),
        description: tx.description,
        date: tx.transactionDate
      })),
      recentInterest: recentInterest.map(interest => ({
        id: interest.id,
        date: interest.calculationDate,
        principalAmount: parseFloat(interest.principalAmount),
        interestAmount: parseFloat(interest.interestAmount),
        status: interest.status
      }))
    });
    
  } catch (error) {
    console.error('Error fetching revolving credit account:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch credit account details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/revolving-credit/eligible-receipts
 * Get warehouse receipts eligible for use as collateral
 */
router.get('/eligible-receipts', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
    
    // Get all warehouse receipts that are:
    // 1. Owned by the user
    // 2. Status is 'receipt_generated'
    // 3. Not already pledged
    const eligibleReceipts = await db.query.warehouseReceipts.findMany({
      where: and(
        eq(warehouseReceipts.userId, userId),
        eq(warehouseReceipts.status, 'receipt_generated')
      )
    });
    
    // Check which ones are already pledged
    const pledgedReceiptIds = new Set(
      (await db.query.warehouseReceiptCollateral.findMany({
        where: eq(warehouseReceiptCollateral.isPledged, true)
      })).map(cr => cr.warehouseReceiptId)
    );
    
    // Filter out pledged receipts and calculate credit potential
    const availableReceipts = eligibleReceipts
      .filter(receipt => !pledgedReceiptIds.has(receipt.id))
      .map(receipt => {
        const commodityValue = parseFloat(receipt.valuation || '0');
        const creditLimit = commodityValue * LTV_RATIO;
        
        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          commodityType: receipt.commodityType,
          quantity: receipt.quantity,
          unit: receipt.unit,
          valuation: commodityValue,
          potentialCreditLimit: creditLimit,
          warehouseName: receipt.warehouseName,
          storageStartDate: receipt.storageStartDate,
          qualityGrade: receipt.qualityGrade
        };
      });
    
    res.json({
      success: true,
      eligibleReceipts: availableReceipts,
      totalPotentialCredit: availableReceipts.reduce((sum, r) => sum + r.potentialCreditLimit, 0)
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
router.post('/pledge-collateral', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
    const { warehouseReceiptId } = req.body;
    
    if (!warehouseReceiptId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Warehouse receipt ID is required' 
      });
    }
    
    // Verify receipt ownership and status
    const receipt = await db.query.warehouseReceipts.findFirst({
      where: and(
        eq(warehouseReceipts.id, warehouseReceiptId),
        eq(warehouseReceipts.userId, userId),
        eq(warehouseReceipts.status, 'receipt_generated')
      )
    });
    
    if (!receipt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Warehouse receipt not found or not eligible for collateral' 
      });
    }
    
    // Check if already pledged
    const existingPledge = await db.query.warehouseReceiptCollateral.findFirst({
      where: and(
        eq(warehouseReceiptCollateral.warehouseReceiptId, warehouseReceiptId),
        eq(warehouseReceiptCollateral.isPledged, true)
      )
    });
    
    if (existingPledge) {
      return res.status(400).json({ 
        success: false, 
        message: 'This warehouse receipt is already pledged as collateral' 
      });
    }
    
    // Get or create credit account
    let account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      const [newAccount] = await db.insert(revolvingCreditAccounts).values({
        userId,
        totalCreditLimit: '0',
        utilizedAmount: '0',
        availableCredit: '0',
        annualInterestRate: ANNUAL_INTEREST_RATE.toString(),
        status: 'active',
        lastInterestCalculationDate: new Date()
      }).returning();
      
      account = newAccount;
    }
    
    // Calculate credit limit (80% LTV)
    const commodityValue = parseFloat(receipt.valuation || '0');
    const creditLimit = commodityValue * LTV_RATIO;
    
    // Create collateral record
    const [collateral] = await db.insert(warehouseReceiptCollateral).values({
      creditAccountId: account.id,
      warehouseReceiptId: warehouseReceiptId,
      pledgedAmount: commodityValue.toString(),
      currentMarketValue: commodityValue.toString(),
      creditLimit: creditLimit.toString(),
      ltvRatio: LTV_RATIO.toString(),
      isPledged: true,
      pledgedAt: new Date()
    }).returning();
    
    // Update credit account limits
    const newTotalCreditLimit = parseFloat(account.totalCreditLimit) + creditLimit;
    const currentUtilized = parseFloat(account.utilizedAmount);
    const newAvailableCredit = newTotalCreditLimit - currentUtilized;
    
    await db.update(revolvingCreditAccounts)
      .set({
        totalCreditLimit: newTotalCreditLimit.toString(),
        availableCredit: newAvailableCredit.toString(),
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    // Update warehouse receipt status to show it's collateralized
    await db.update(warehouseReceipts)
      .set({
        liens: JSON.stringify({
          collateralized: true,
          creditAccountId: account.id,
          pledgedAmount: commodityValue,
          creditLimit: creditLimit,
          pledgedAt: new Date().toISOString()
        })
      })
      .where(eq(warehouseReceipts.id, warehouseReceiptId));
    
    res.json({
      success: true,
      message: 'Warehouse receipt successfully pledged as collateral',
      collateral: {
        id: collateral.id,
        commodityValue,
        creditLimit,
        ltvRatio: LTV_RATIO
      },
      account: {
        totalCreditLimit: newTotalCreditLimit,
        utilizedAmount: currentUtilized,
        availableCredit: newAvailableCredit
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
router.post('/withdraw', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
    const { amount, bankAccountId, purpose } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid withdrawal amount is required' 
      });
    }
    
    if (!bankAccountId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bank account ID is required' 
      });
    }
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'No credit account found. Please pledge collateral first.' 
      });
    }
    
    const availableCredit = parseFloat(account.availableCredit);
    
    if (amount > availableCredit) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient credit. Available: ₹${availableCredit.toLocaleString()}` 
      });
    }
    
    // Create withdrawal transaction
    const newUtilized = parseFloat(account.utilizedAmount) + amount;
    const newAvailable = parseFloat(account.totalCreditLimit) - newUtilized;
    
    const [transaction] = await db.insert(creditTransactions).values({
      creditAccountId: account.id,
      transactionType: 'withdrawal',
      amount: amount.toString(),
      balanceAfter: newUtilized.toString(),
      description: purpose || 'Credit withdrawal',
      bankAccountId: bankAccountId,
      transactionDate: new Date(),
      status: 'completed'
    }).returning();
    
    // Update account
    await db.update(revolvingCreditAccounts)
      .set({
        utilizedAmount: newUtilized.toString(),
        availableCredit: newAvailable.toString(),
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    res.json({
      success: true,
      message: `Successfully withdrawn ₹${amount.toLocaleString()}`,
      transaction: {
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        type: transaction.transactionType,
        date: transaction.transactionDate,
        status: transaction.status
      },
      account: {
        totalCreditLimit: parseFloat(account.totalCreditLimit),
        utilizedAmount: newUtilized,
        availableCredit: newAvailable
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
router.post('/repay', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
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
        message: 'No credit account found' 
      });
    }
    
    const currentUtilized = parseFloat(account.utilizedAmount);
    
    if (amount > currentUtilized) {
      return res.status(400).json({ 
        success: false, 
        message: `Repayment amount exceeds outstanding balance of ₹${currentUtilized.toLocaleString()}` 
      });
    }
    
    // Create repayment transaction
    const newUtilized = currentUtilized - amount;
    const newAvailable = parseFloat(account.totalCreditLimit) - newUtilized;
    
    const [transaction] = await db.insert(creditTransactions).values({
      creditAccountId: account.id,
      transactionType: 'repayment',
      amount: amount.toString(),
      balanceAfter: newUtilized.toString(),
      description: `Repayment via ${paymentMethod || 'bank transfer'}`,
      transactionDate: new Date(),
      status: 'completed'
    }).returning();
    
    // Update account
    await db.update(revolvingCreditAccounts)
      .set({
        utilizedAmount: newUtilized.toString(),
        availableCredit: newAvailable.toString(),
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    res.json({
      success: true,
      message: `Successfully repaid ₹${amount.toLocaleString()}`,
      transaction: {
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        type: transaction.transactionType,
        date: transaction.transactionDate,
        status: transaction.status
      },
      account: {
        totalCreditLimit: parseFloat(account.totalCreditLimit),
        utilizedAmount: newUtilized,
        availableCredit: newAvailable
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
router.post('/unpledge-collateral', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
    const { warehouseReceiptId } = req.body;
    
    if (!warehouseReceiptId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Warehouse receipt ID is required' 
      });
    }
    
    // Get the collateral record
    const collateral = await db.query.warehouseReceiptCollateral.findFirst({
      where: and(
        eq(warehouseReceiptCollateral.warehouseReceiptId, warehouseReceiptId),
        eq(warehouseReceiptCollateral.isPledged, true)
      ),
      with: {
        creditAccount: true
      }
    });
    
    if (!collateral) {
      return res.status(404).json({ 
        success: false, 
        message: 'Collateral record not found or already unpledged' 
      });
    }
    
    // Verify ownership
    if (collateral.creditAccount.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }
    
    const account = collateral.creditAccount;
    const creditLimitFromThisReceipt = parseFloat(collateral.creditLimit);
    const newTotalCreditLimit = parseFloat(account.totalCreditLimit) - creditLimitFromThisReceipt;
    const currentUtilized = parseFloat(account.utilizedAmount);
    
    // Check if unpledging would cause over-utilization
    if (currentUtilized > newTotalCreditLimit) {
      const excessAmount = currentUtilized - newTotalCreditLimit;
      return res.status(400).json({ 
        success: false, 
        message: `Cannot unpledge. Please repay ₹${excessAmount.toLocaleString()} first to maintain sufficient collateral.` 
      });
    }
    
    // Unpledge the collateral
    await db.update(warehouseReceiptCollateral)
      .set({
        isPledged: false,
        unpledgedAt: new Date()
      })
      .where(eq(warehouseReceiptCollateral.id, collateral.id));
    
    // Update credit account
    const newAvailableCredit = newTotalCreditLimit - currentUtilized;
    
    await db.update(revolvingCreditAccounts)
      .set({
        totalCreditLimit: newTotalCreditLimit.toString(),
        availableCredit: newAvailableCredit.toString(),
        updatedAt: new Date()
      })
      .where(eq(revolvingCreditAccounts.id, account.id));
    
    // Update warehouse receipt to remove lien
    await db.update(warehouseReceipts)
      .set({
        liens: null
      })
      .where(eq(warehouseReceipts.id, warehouseReceiptId));
    
    res.json({
      success: true,
      message: 'Warehouse receipt successfully unpledged',
      account: {
        totalCreditLimit: newTotalCreditLimit,
        utilizedAmount: currentUtilized,
        availableCredit: newAvailableCredit
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
router.get('/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.json({
        success: true,
        transactions: [],
        total: 0
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
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.transactionType,
        amount: parseFloat(tx.amount),
        balanceAfter: parseFloat(tx.balanceAfter),
        description: tx.description,
        date: tx.transactionDate,
        status: tx.status,
        bankAccountId: tx.bankAccountId
      })),
      total: count,
      limit,
      offset
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
router.get('/interest-history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId as number;
    const days = parseInt(req.query.days as string) || 30;
    
    // Get credit account
    const account = await db.query.revolvingCreditAccounts.findFirst({
      where: eq(revolvingCreditAccounts.userId, userId)
    });
    
    if (!account) {
      return res.json({
        success: true,
        interestHistory: [],
        totalInterest: 0
      });
    }
    
    // Get interest calculations
    const interestHistory = await db.query.dailyInterestCalculations.findMany({
      where: eq(dailyInterestCalculations.creditAccountId, account.id),
      orderBy: [desc(dailyInterestCalculations.calculationDate)],
      limit: days
    });
    
    const totalInterest = interestHistory.reduce(
      (sum, record) => sum + parseFloat(record.interestAmount), 
      0
    );
    
    res.json({
      success: true,
      interestHistory: interestHistory.map(record => ({
        id: record.id,
        date: record.calculationDate,
        principalAmount: parseFloat(record.principalAmount),
        interestRate: parseFloat(record.interestRate),
        interestAmount: parseFloat(record.interestAmount),
        status: record.status
      })),
      totalInterest,
      days: interestHistory.length
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
  res.json({ message: 'Revolving credit router is working!', timestamp: new Date().toISOString() });
});

export default router;
