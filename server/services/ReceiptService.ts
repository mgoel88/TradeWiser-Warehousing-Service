/**
 * Receipt Service
 * 
 * Handles generation, storage, and retrieval of payment receipts.
 */
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LoanRepayment, BankPayment } from '@shared/schema';

// Ensure receipts directory exists
const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
  console.log(`Created receipts directory at ${RECEIPTS_DIR}`);
}

/**
 * Generate a unique receipt number
 * Format: TW-RCPT-{timestamp}-{random digits}
 */
function generateReceiptNumber(): string {
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TW-RCPT-${timestamp}-${randomDigits}`;
}

interface ReceiptResult {
  url: string;
  filepath: string;
  receiptNumber: string;
}

/**
 * Additional information that can be included in the receipt
 */
interface ReceiptAdditionalInfo {
  loanDetails?: {
    interestRate: string;
    startDate: string;
    lendingPartnerName: string;
  };
  userDetails?: {
    fullName: string;
    email: string;
    phone: string | null;
  };
}

class ReceiptService {
  /**
   * Generate a receipt for a bank payment
   * @param payment Bank payment details
   * @param loanRepayment Loan repayment details
   * @returns Object containing receipt information
   */
  async createReceipt(
    payment: BankPayment, 
    loanRepayment: LoanRepayment, 
    additionalInfo?: ReceiptAdditionalInfo
  ): Promise<ReceiptResult> {
    return this.generateReceipt(payment, loanRepayment, additionalInfo);
  }
  /**
   * Generate a PDF receipt for a payment
   * @param payment Bank payment details
   * @param loanRepayment Loan repayment details
   * @param additionalInfo Additional information for the receipt
   * @returns Object containing path to the generated receipt
   */
  async generateReceipt(
    payment: BankPayment, 
    loanRepayment: LoanRepayment,
    additionalInfo?: ReceiptAdditionalInfo
  ): Promise<ReceiptResult> {
    // Use existing receipt number if available, otherwise generate new one
    const receiptNumber = loanRepayment.receiptNumber || generateReceiptNumber();
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('TradeWiser Payment Receipt', 105, 20, { align: 'center' });
    
    // Add logo placeholder
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('[TradeWiser Logo]', 105, 30, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0);
    
    // Add receipt number and date
    doc.setFontSize(12);
    doc.text(`Receipt Number: ${receiptNumber}`, 15, 40);
    doc.text(`Date: ${new Date(payment.timestamp).toLocaleDateString()}`, 15, 47);
    
    // Add payment information
    doc.setFontSize(14);
    doc.text('Payment Information', 15, 60);
    
    // Payment details table
    const paymentData = [
      ['Transaction ID', payment.transactionId],
      ['Amount', `₹${parseFloat(loanRepayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Status', payment.status],
      ['Payment Method', loanRepayment.paymentMethod],
      ['Principal Amount', `₹${parseFloat(loanRepayment.principalAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Interest Amount', `₹${parseFloat(loanRepayment.interestAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
    ];
    
    // @ts-ignore - jsPDF-autoTable extends jsPDF but TypeScript doesn't recognize it
    doc.autoTable({
      startY: 65,
      body: paymentData,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 'auto' } 
      },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Get the latest y position after the table
    // @ts-ignore - jsPDF-autoTable adds lastAutoTable to jsPDF
    const lastY = doc.lastAutoTable.finalY + 10;
    
    // Add loan information if available
    if (additionalInfo?.loanDetails) {
      doc.setFontSize(14);
      doc.text('Loan Information', 15, lastY);
      
      const loanData = [
        ['Loan ID', `#${loanRepayment.loanId}`],
        ['Interest Rate', `${additionalInfo.loanDetails.interestRate}%`],
        ['Start Date', additionalInfo.loanDetails.startDate],
        ['Lending Partner', additionalInfo.loanDetails.lendingPartnerName]
      ];
      
      // @ts-ignore - jsPDF-autoTable extends jsPDF
      doc.autoTable({
        startY: lastY + 5,
        body: loanData,
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 'auto' } 
        },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        'This is a computer-generated receipt and does not require a signature. For any queries, please contact support@tradewiser.com',
        105, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
      
      // Add page number
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 5,
        { align: 'center' }
      );
    }
    
    // Save PDF
    const filename = `receipt-${receiptNumber}.pdf`;
    const filepath = path.join(RECEIPTS_DIR, filename);
    
    // Save the PDF to disk
    const pdfOutput = doc.output();
    fs.writeFileSync(filepath, pdfOutput, 'binary');
    
    // Return the URL to the receipt
    return {
      url: `/uploads/receipts/${filename}`,
      filepath,
      receiptNumber
    };
  }
  
  /**
   * Retrieve a receipt by its filename
   * @param filename Name of the receipt file
   * @returns The receipt file buffer or null if not found
   */
  getReceiptFile(filename: string): Buffer | null {
    try {
      const filepath = path.join(RECEIPTS_DIR, filename);
      
      // Ensure the file exists and is within the receipts directory
      if (!fs.existsSync(filepath) || !filepath.startsWith(RECEIPTS_DIR)) {
        console.error(`Receipt file not found or invalid path: ${filepath}`);
        return null;
      }
      
      // Read and return the file
      return fs.readFileSync(filepath);
    } catch (error) {
      console.error('Error retrieving receipt file:', error);
      return null;
    }
  }
}

export const receiptService = new ReceiptService();