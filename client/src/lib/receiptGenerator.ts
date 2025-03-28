import { jsPDF } from 'jspdf';

interface ReceiptData {
  receiptNumber: string;
  issueDate: string;
  expiryDate: string;
  depositorName: string;
  commodityName: string;
  quantity: string;
  qualityGrade: string;
  warehouseName: string;
  warehouseAddress: string;
  valuationAmount: string;
  verificationCode: string;
  smartContractId?: string;
}

/**
 * Generate a PDF warehouse receipt document
 */
export const generateReceiptPDF = async (data: ReceiptData): Promise<Blob> => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Document styles
  const titleFont = 16;
  const headingFont = 12;
  const normalFont = 10;
  const smallFont = 8;
  const margin = 20;
  const lineHeight = 7;
  
  // Current Y position tracker
  let y = margin;
  
  // Add header
  doc.setFontSize(titleFont);
  doc.setFont('helvetica', 'bold');
  doc.text('WAREHOUSE RECEIPT', 105, y, { align: 'center' });
  
  y += lineHeight * 2;
  
  // Add TradeWiser logo/branding
  doc.setFontSize(normalFont);
  doc.setFont('helvetica', 'normal');
  doc.text('TradeWiser Platform', 105, y, { align: 'center' });
  
  y += lineHeight * 2;
  
  // Add receipt number with decorative border
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, 170, 15, 'F');
  doc.setFontSize(headingFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Warehouse Receipt Number:', margin + 5, y + 7);
  doc.setFont('courier', 'bold');
  doc.text(data.receiptNumber, 105, y + 7);
  
  // Add smart contract ID if available
  if (data.smartContractId) {
    doc.setFontSize(smallFont);
    doc.setFont('courier', 'normal');
    doc.text(`Smart Contract ID: ${data.smartContractId}`, margin + 5, y + 12);
  }
  
  y += 20;
  
  // Add dates section
  doc.setFontSize(normalFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.issueDate, margin + 30, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Expiry Date:', 105, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.expiryDate, 105 + 30, y);
  
  y += lineHeight * 2;
  
  // Depositor details
  doc.setFontSize(headingFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Depositor:', margin, y);
  
  y += lineHeight;
  
  doc.setFontSize(normalFont);
  doc.setFont('helvetica', 'normal');
  doc.text(data.depositorName, margin + 5, y);
  
  y += lineHeight * 2;
  
  // Commodity details
  doc.setFontSize(headingFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Commodity Details:', margin, y);
  
  y += lineHeight;
  
  // Create table-like structure for commodity details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, 170, 7, 'F');
  
  doc.setFontSize(normalFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Commodity', margin + 5, y + 5);
  doc.text('Quantity', margin + 60, y + 5);
  doc.text('Quality Grade', margin + 100, y + 5);
  doc.text('Valuation', margin + 140, y + 5);
  
  y += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text(data.commodityName, margin + 5, y + 5);
  doc.text(data.quantity, margin + 60, y + 5);
  doc.text(data.qualityGrade, margin + 100, y + 5);
  doc.text(data.valuationAmount, margin + 140, y + 5);
  
  y += lineHeight * 3;
  
  // Warehouse details
  doc.setFontSize(headingFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Storage Facility:', margin, y);
  
  y += lineHeight;
  
  doc.setFontSize(normalFont);
  doc.setFont('helvetica', 'normal');
  doc.text(data.warehouseName, margin + 5, y);
  
  y += lineHeight;
  
  doc.setFont('helvetica', 'normal');
  doc.text(data.warehouseAddress, margin + 5, y);
  
  y += lineHeight * 3;
  
  // Verification information
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, 170, 25, 'F');
  
  doc.setFontSize(headingFont);
  doc.setFont('helvetica', 'bold');
  doc.text('Blockchain Verification:', margin + 5, y + 7);
  
  y += lineHeight;
  
  doc.setFontSize(normalFont);
  doc.setFont('helvetica', 'normal');
  doc.text('This electronic warehouse receipt is secured using blockchain technology.', margin + 5, y + 7);
  
  y += lineHeight;
  
  doc.setFont('courier', 'bold');
  doc.text(`Verification Code: ${data.verificationCode}`, margin + 5, y + 7);
  
  y += lineHeight * 2;
  
  // Legal disclaimer
  doc.setFontSize(smallFont);
  doc.setFont('helvetica', 'italic');
  doc.text('This warehouse receipt represents ownership of the commodity described herein.', margin, y + 10);
  doc.text('The holder of this receipt may transfer ownership or use it as collateral.', margin, y + 15);
  
  // Add QR code placeholder
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(150, y + 5, 30, 30, 2, 2, 'F');
  doc.setFontSize(smallFont);
  doc.setFont('helvetica', 'normal');
  doc.text('Scan QR to verify', 165, y + 40, { align: 'center' });
  
  // Return PDF as blob
  return doc.output('blob');
};

/**
 * Generate a plain text representation of the receipt for copying
 */
export const generatePlainTextReceipt = (data: ReceiptData): string => {
  return `
WAREHOUSE RECEIPT
-----------------
Receipt Number: ${data.receiptNumber}
${data.smartContractId ? `Smart Contract ID: ${data.smartContractId}` : ''}

Issue Date: ${data.issueDate}
Expiry Date: ${data.expiryDate}

Depositor: ${data.depositorName}

COMMODITY DETAILS:
Commodity: ${data.commodityName}
Quantity: ${data.quantity}
Quality Grade: ${data.qualityGrade}
Valuation: ${data.valuationAmount}

STORAGE FACILITY:
${data.warehouseName}
${data.warehouseAddress}

BLOCKCHAIN VERIFICATION:
Verification Code: ${data.verificationCode}

This warehouse receipt represents ownership of the commodity described herein.
The holder of this receipt may transfer ownership or use it as collateral.
`;
};

/**
 * Generate and download a PDF receipt file with a given filename
 */
export const downloadReceiptPDF = async (data: ReceiptData, filename: string = 'warehouse-receipt.pdf'): Promise<void> => {
  try {
    // Generate the PDF blob
    const pdfBlob = await generateReceiptPDF(data);
    
    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error downloading receipt PDF:', error);
    throw error;
  }
};