import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as PDFLib from 'pdf-lib';
import csvParser from 'csv-parser';
import { PNG } from 'pngjs';
import { WarehouseReceipt, insertWarehouseReceiptSchema } from '@shared/schema';
import { storage } from '../storage';

/**
 * DocumentParsingService
 * 
 * Extracts data from uploaded warehouse receipts in various formats
 * and transforms it into a standardized format for the TradeWiser system.
 */
class DocumentParsingService {
  /**
   * Extract text from an image file using OCR
   */
  async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      const { data } = await Tesseract.recognize(
        imagePath,
        'eng', // Use English language model
        { logger: m => console.log(m) } // Optional logging
      );
      
      return data.text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract text from a PDF file
   */
  async extractTextFromPdf(pdfPath: string): Promise<string> {
    try {
      // Read the PDF file
      const pdfBytes = await fs.promises.readFile(pdfPath);
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      
      let allText = '';
      const pages = pdfDoc.getPages();
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        // This is a simplified approach - for real PDF text extraction 
        // we would need a more robust library like pdf.js or pdf-parse
        // For now, we'll extract what's available in the document
        const text = page.getTextContent ? await page.getTextContent() : '';
        allText += text + '\n';
      }
      
      // If we couldn't extract text directly, we might need to use OCR on PDF pages
      if (!allText.trim()) {
        // Convert first page to PNG and run OCR
        // This would require additional code to render the PDF page
        
        // For now, return a placeholder message
        return 'PDF text extraction requires additional processing.';
      }
      
      return allText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract data from a CSV file
   */
  async extractDataFromCsv(csvPath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (data: any) => {
          results.push(data);
        })
        .on('error', (error: any) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        })
        .on('end', () => {
          resolve(results);
        });
    });
  }

  /**
   * Extract data from an Excel file
   */
  extractDataFromExcel(excelPath: string): any[] {
    try {
      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0]; // Get first sheet
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error(`Excel processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse extracted text from an OCR or PDF to extract structured data
   * This uses a rule-based approach to identify relevant fields
   */
  parseExtractedText(text: string): Partial<WarehouseReceipt> {
    const receiptData: Partial<WarehouseReceipt> = {
      status: 'active',
    };
    
    // Extract receipt number
    const receiptNumberMatch = text.match(/receipt\s*(?:no|number|#)[:.\s]*([A-Z0-9-]+)/i);
    if (receiptNumberMatch && receiptNumberMatch[1]) {
      receiptData.receiptNumber = receiptNumberMatch[1].trim();
    }
    
    // Extract issued date
    const dateMatch = text.match(/(?:date|issued|dated)[:.\s]*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i);
    if (dateMatch && dateMatch[1]) {
      receiptData.issuedDate = new Date(dateMatch[1]);
    }
    
    // Extract commodity details
    const commodityMatch = text.match(/commodity[:.\s]*([A-Za-z\s]+)/i);
    if (commodityMatch && commodityMatch[1]) {
      receiptData.commodityName = commodityMatch[1].trim();
    }
    
    // Extract quality/grade
    const qualityMatch = text.match(/(?:quality|grade)[:.\s]*([A-Za-z0-9\s]+)/i);
    if (qualityMatch && qualityMatch[1]) {
      receiptData.qualityGrade = qualityMatch[1].trim();
    }
    
    // Extract quantity
    const quantityMatch = text.match(/quantity[:.\s]*(\d+(?:[,.]\d+)?)\s*([A-Za-z]+)?/i);
    if (quantityMatch) {
      receiptData.quantity = quantityMatch[1].replace(',', '');
      if (quantityMatch[2]) {
        receiptData.measurementUnit = quantityMatch[2].trim();
      }
    }
    
    // Extract warehouse details
    const warehouseMatch = text.match(/warehouse[:.\s]*([A-Za-z0-9\s]+)/i);
    if (warehouseMatch && warehouseMatch[1]) {
      receiptData.warehouseName = warehouseMatch[1].trim();
    }
    
    const addressMatch = text.match(/address[:.\s]*([^\n]+)/i);
    if (addressMatch && addressMatch[1]) {
      receiptData.warehouseAddress = addressMatch[1].trim();
    }
    
    // Extract valuation if available
    const valuationMatch = text.match(/(?:value|valuation|worth)[:.\s]*(?:Rs\.|INR|₹)?\s*(\d+(?:[,.]\d+)?)/i);
    if (valuationMatch && valuationMatch[1]) {
      receiptData.valuation = valuationMatch[1].replace(',', '');
    }
    
    return receiptData;
  }

  /**
   * Transform data from CSV/Excel format to Receipt format
   */
  transformStructuredData(data: any[]): Partial<WarehouseReceipt>[] {
    return data.map((item: any) => {
      const receipt: Partial<WarehouseReceipt> = {
        status: 'active',
      };
      
      // Map common field names with various possible formats
      const fieldMappings = {
        receiptNumber: ['receipt_number', 'receipt_no', 'receipt_id', 'receiptNo', 'receiptID'],
        issuedDate: ['issued_date', 'issue_date', 'date', 'receipt_date', 'issuedDate', 'issueDate'],
        commodityName: ['commodity', 'commodity_name', 'product', 'item', 'commodityName'],
        qualityGrade: ['quality', 'grade', 'quality_grade', 'qualityGrade'],
        quantity: ['quantity', 'qty', 'amount'],
        measurementUnit: ['unit', 'measurement', 'measurement_unit', 'measurementUnit'],
        warehouseName: ['warehouse', 'warehouse_name', 'storehouse', 'warehouseName'],
        warehouseAddress: ['address', 'warehouse_address', 'location', 'warehouseAddress'],
        valuation: ['value', 'valuation', 'worth', 'price', 'estimated_value']
      };
      
      // For each field in our mappings, check if any of the potential column names exist
      Object.entries(fieldMappings).forEach(([targetField, possibleColumns]) => {
        for (const col of possibleColumns) {
          if (item[col] !== undefined) {
            if (targetField === 'issuedDate') {
              receipt[targetField] = new Date(item[col]);
            } else {
              receipt[targetField] = item[col].toString();
            }
            break;
          }
        }
      });
      
      return receipt;
    });
  }

  /**
   * Process an uploaded file based on its type
   */
  async processUploadedFile(filePath: string, fileType: string, userId: number): Promise<{
    receipts: Partial<WarehouseReceipt>[];
    message: string;
  }> {
    try {
      let receipts: Partial<WarehouseReceipt>[] = [];
      let message = '';
      
      // Process based on file type
      if (fileType.includes('image/')) {
        // Handle images
        const extractedText = await this.extractTextFromImage(filePath);
        const receiptData = this.parseExtractedText(extractedText);
        
        if (receiptData.receiptNumber) {
          receipts = [{ ...receiptData, ownerId: userId }];
          message = 'Successfully extracted receipt data from image';
        } else {
          message = 'Image processed but no clear receipt data found. Please verify and fill in details manually.';
        }
      } else if (fileType.includes('pdf')) {
        // Handle PDF files
        const extractedText = await this.extractTextFromPdf(filePath);
        const receiptData = this.parseExtractedText(extractedText);
        
        if (receiptData.receiptNumber) {
          receipts = [{ ...receiptData, ownerId: userId }];
          message = 'Successfully extracted receipt data from PDF';
        } else {
          message = 'PDF processed but no clear receipt data found. Please verify and fill in details manually.';
        }
      } else if (fileType.includes('csv')) {
        // Handle CSV files
        const csvData = await this.extractDataFromCsv(filePath);
        receipts = this.transformStructuredData(csvData).map(receipt => ({ ...receipt, ownerId: userId }));
        message = `Successfully processed ${receipts.length} receipts from CSV`;
      } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
        // Handle Excel files
        const excelData = this.extractDataFromExcel(filePath);
        receipts = this.transformStructuredData(excelData).map(receipt => ({ ...receipt, ownerId: userId }));
        message = `Successfully processed ${receipts.length} receipts from Excel`;
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Save receipts to database - this could be moved to a separate function
      const savedReceipts = [];
      for (const receipt of receipts) {
        try {
          // Check if receipt already exists
          const existingReceipt = await storage.getWarehouseReceiptByNumber(receipt.receiptNumber || '');
          
          if (existingReceipt) {
            receipt.id = existingReceipt.id; // Use existing ID for update
            const updated = await storage.updateWarehouseReceipt(existingReceipt.id, receipt);
            savedReceipts.push(updated);
          } else if (receipt.receiptNumber) {
            // Only save if it has a receipt number
            const created = await storage.createWarehouseReceipt(receipt as any);
            savedReceipts.push(created);
          }
        } catch (error) {
          console.error('Error saving receipt:', error);
          // Continue with other receipts even if one fails
        }
      }
      
      return {
        receipts: savedReceipts,
        message: savedReceipts.length === 0 
          ? 'No valid receipts could be saved from the uploaded file' 
          : `Successfully saved ${savedReceipts.length} receipts`
      };
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default new DocumentParsingService();