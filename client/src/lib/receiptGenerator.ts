// Note: This is a mock PDF generator that would need to be replaced with a real one
// like jsPDF or another PDF generation library in production

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
  verificationCode?: string;
}

/**
 * In a real application, this would generate a PDF file using a library like jsPDF
 * For now, this is a mock implementation that simulates PDF generation
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  // This is where you'd generate the actual PDF
  // For this demo, we'll just return a mock Blob with some text
  
  // In a real implementation:
  // const doc = new jsPDF();
  // doc.setFont("helvetica");
  // doc.setFontSize(20);
  // doc.text("Electronic Warehouse Receipt", 105, 20, { align: "center" });
  // ... add more content to the PDF
  // return doc.output('blob');
  
  // Mock PDF text
  const pdfText = `
    ELECTRONIC WAREHOUSE RECEIPT
    ---------------------------
    
    Receipt Number: ${data.receiptNumber}
    Issue Date: ${data.issueDate}
    Expiry Date: ${data.expiryDate}
    
    Depositor: ${data.depositorName}
    
    Commodity: ${data.commodityName}
    Quantity: ${data.quantity}
    Quality Grade: ${data.qualityGrade}
    Valuation: ${data.valuationAmount}
    
    Warehouse: ${data.warehouseName}
    Location: ${data.warehouseAddress}
    
    Verification Code: ${data.verificationCode || "N/A"}
    
    This Electronic Warehouse Receipt (eWR) is a digital representation
    of stored commodities and can be used as collateral for loans or
    traded on commodity exchanges. The eWR is secured by blockchain
    technology ensuring authenticity and immutability.
    
    TradeWiser Platform
    ------------------
    Green Channel Receipt - Secured and Verified
  `;
  
  // Create a mock PDF Blob
  return new Blob([pdfText], { type: 'application/pdf' });
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