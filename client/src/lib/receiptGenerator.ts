import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface ReceiptData {
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
  verificationCode?: string;
}

/**
 * Generate a verification URL for the receipt
 */
export function generateVerificationURL(verificationCode: string): string {
  // In production, this would be a real verification URL
  // For now, we'll simulate it with a URL that could be handled by our frontend router
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify-receipt/${verificationCode}`;
}

/**
 * Generate a QR code data URL for the receipt verification
 */
async function generateQRCodeDataURL(verificationCode: string): Promise<string> {
  try {
    // Generate a verification URL for the QR code
    const verificationUrl = generateVerificationURL(verificationCode);
    
    // Generate QR code as data URL with the verification URL
    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

/**
 * Generate a professionally formatted PDF warehouse receipt using jsPDF with QR code
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Generate QR code for verification
  const qrCodeDataUrl = await generateQRCodeDataURL(data.verificationCode || 'NO_VERIFICATION_CODE');
  
  // Set fonts and colors
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  // Add header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ELECTRONIC WAREHOUSE RECEIPT", 105, 20, { align: "center" });
  
  // Add TradeWiser logo section (text-based logo for now)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TradeWiser", 20, 40);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Green Channel Receipt - Secured and Verified", 20, 45);
  
  // Add horizontal line
  doc.setDrawColor(0, 128, 0); // Green color
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);
  
  // Receipt information section
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPT INFORMATION", 20, 60);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt Number: ${data.receiptNumber}`, 20, 70);
  doc.text(`Issue Date: ${data.issueDate}`, 20, 75);
  doc.text(`Expiry Date: ${data.expiryDate}`, 20, 80);
  
  // Add a decorative receipt status box
  doc.setFillColor(240, 248, 240); // Light green
  doc.roundedRect(140, 65, 40, 20, 2, 2, 'F');
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 100, 0);
  doc.text("ACTIVE", 160, 75, { align: "center" });
  doc.setTextColor(0, 0, 0);
  
  // Depositor information
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DEPOSITOR INFORMATION", 20, 95);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Depositor: ${data.depositorName}`, 20, 105);
  
  // Commodity information
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("COMMODITY INFORMATION", 20, 120);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Commodity: ${data.commodityName}`, 20, 130);
  doc.text(`Quantity: ${data.quantity}`, 20, 135);
  doc.text(`Quality Grade: ${data.qualityGrade}`, 20, 140);
  doc.text(`Valuation: ${data.valuationAmount}`, 20, 145);
  
  // Warehouse information
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("WAREHOUSE INFORMATION", 20, 160);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Warehouse: ${data.warehouseName}`, 20, 170);
  doc.text(`Location: ${data.warehouseAddress}`, 20, 175);
  
  // Verification section
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BLOCKCHAIN VERIFICATION", 20, 195);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Verification Code: ${data.verificationCode || "N/A"}`, 20, 205);
  
  // Add QR code if we have a data URL
  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', 160, 190, 25, 25);
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
      // Fallback to rectangle if image fails
      doc.setFillColor(240, 240, 240);
      doc.rect(160, 190, 25, 25, 'F');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("QR Code", 172.5, 202.5, { align: "center" });
    }
  }
  
  // Add footer with disclaimer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`This Electronic Warehouse Receipt (eWR) is a digital representation of stored commodities and can be used as`, 105, 240, { align: "center" });
  doc.text(`collateral for loans or traded on commodity exchanges. The eWR is secured by blockchain technology ensuring authenticity.`, 105, 245, { align: "center" });
  
  // Add decorative element
  doc.setDrawColor(0, 128, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 250, 190, 250);
  
  // Return the PDF as a blob
  return doc.output('blob');
}

/**
 * Download the generated receipt PDF
 */
export async function downloadReceiptPDF(data: ReceiptData): Promise<void> {
  try {
    // Generate the PDF
    const pdfBlob = await generateReceiptPDF(data);
    
    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WR_${data.receiptNumber}.pdf`;
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    throw error;
  }
}

/**
 * Generate verification code for the receipt
 */
export function generateVerificationCode(processId: number): string {
  const timestamp = Math.floor(Date.now()/1000).toString(16).toUpperCase();
  const randomPart = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `WR-${processId}-${timestamp}-${randomPart}`;
}

/**
 * Create a receipt number with format WR-YYYYMMDD-XXXX
 */
export function generateReceiptNumber(processId: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `WR-${year}${month}${day}-${random}-${processId}`;
}