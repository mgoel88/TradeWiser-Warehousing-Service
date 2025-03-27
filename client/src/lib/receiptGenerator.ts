import jsPDF from 'jspdf';

/**
 * Interface for receipt data
 */
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
}

/**
 * Generates and downloads a PDF warehouse receipt
 */
export async function downloadReceiptPDF(data: ReceiptData): Promise<void> {
  try {
    // Create new PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set up page
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20; // Start position for content
    const lineHeight = 7;
    
    // Helper for centered text
    const centerText = (text: string, y: number, fontSize = 12) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
      return y + lineHeight;
    };
    
    // Helper for drawing a line
    const drawLine = (y: number) => {
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(20, y, pageWidth - 20, y);
      return y + lineHeight;
    };
    
    // Add a field with label and value
    const addField = (label: string, value: string, y: number) => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(label, 20, y);
      doc.setFont(undefined, 'normal');
      doc.text(value, 80, y);
      return y + lineHeight;
    };
    
    // Title
    doc.setFont(undefined, 'bold');
    y = centerText('ELECTRONIC WAREHOUSE RECEIPT', y, 16);
    doc.setFont(undefined, 'normal');
    y = centerText('TradeWiser Commodity Platform', y + 3, 12);
    y = centerText('Secured by Blockchain Technology', y, 10);
    
    y = drawLine(y + 5);
    
    // Basic information
    y = addField('Receipt Number:', data.receiptNumber, y + 5);
    y = addField('Issue Date:', data.issueDate, y);
    y = addField('Expiry Date:', data.expiryDate, y);
    y = addField('Depositor:', data.depositorName, y);
    
    y = drawLine(y + 3);
    
    // Commodity information
    y = centerText('COMMODITY DETAILS', y + 7, 12);
    y = addField('Name:', data.commodityName, y + 5);
    y = addField('Quantity:', data.quantity, y);
    y = addField('Quality Grade:', data.qualityGrade, y);
    y = addField('Valuation:', data.valuationAmount, y);
    
    y = drawLine(y + 3);
    
    // Warehouse information
    y = centerText('WAREHOUSE DETAILS', y + 7, 12);
    y = addField('Name:', data.warehouseName, y + 5);
    y = addField('Address:', data.warehouseAddress, y);
    
    y = drawLine(y + 3);
    
    // Legal text
    doc.setFontSize(8);
    let legalText = 'This Electronic Warehouse Receipt (eWR) represents title to the commodity described herein, ';
    legalText += 'stored at the specified warehouse. It is issued in accordance with the Warehousing Development and ';
    legalText += 'Regulation Act and is transferable by endorsement. The holder of this receipt is entitled to the ';
    legalText += 'commodity subject to the warehouse charges and conditions specified.';
    
    // Split text to fit on page
    const splitText = doc.splitTextToSize(legalText, pageWidth - 40);
    doc.text(splitText, 20, y + 7);
    
    y += splitText.length * 4 + 5;
    
    // Verification code
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Verification Code:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(data.verificationCode, 70, y);
    
    y += lineHeight * 2;
    
    // Fake signature placeholder
    doc.setFont(undefined, 'bold');
    doc.text('TradeWiser Platform', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text('DIGITALLY SIGNED', 20, y + 4);
    
    // Download PDF
    doc.save(`TradeWiser_Receipt_${data.receiptNumber}.pdf`);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Promise.reject(error);
  }
}