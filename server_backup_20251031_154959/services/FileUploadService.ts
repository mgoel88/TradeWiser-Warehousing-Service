import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Request } from 'express';
import { promises as fsPromises } from 'fs';

/**
 * FileUploadService
 * 
 * Handles file uploads and storage for warehouse receipt documents
 */
export class FileUploadService {
  private uploadDir: string;
  private receiptAttachmentsDir: string;

  constructor() {
    // Set upload directory for temporary files
    this.uploadDir = path.join(process.cwd(), 'uploads');
    
    // Set permanent directory for receipt attachments
    this.receiptAttachmentsDir = path.join(process.cwd(), 'uploads', 'receipts');
    
    // Create directories if they don't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.receiptAttachmentsDir)) {
      fs.mkdirSync(this.receiptAttachmentsDir, { recursive: true });
    }
  }

  /**
   * Save an uploaded file to disk
   */
  async saveUploadedFile(file: Express.Multer.File, isTemporary: boolean = true): Promise<{
    filePath: string;
    fileName: string;
    fileType: string;
    fileUrl?: string;
  }> {
    try {
      // Generate a unique filename to prevent collisions
      const fileExtension = path.extname(file.originalname);
      const timestamp = Date.now().toString();
      const hashedName = crypto
        .createHash('md5')
        .update(file.originalname + timestamp)
        .digest('hex');
      
      const fileName = `${hashedName}${fileExtension}`;
      
      // Determine directory based on whether it's temporary or permanent
      const targetDir = isTemporary ? this.uploadDir : this.receiptAttachmentsDir;
      const filePath = path.join(targetDir, fileName);
      
      // Write the file to disk
      await fsPromises.writeFile(filePath, file.buffer);
      
      // Generate a URL for permanent files
      const fileUrl = isTemporary ? undefined : `/api/receipts/attachments/${fileName}`;
      
      return {
        filePath,
        fileName,
        fileType: file.mimetype,
        fileUrl
      };
    } catch (error) {
      console.error('Error saving uploaded file:', error);
      throw new Error(`Failed to save uploaded file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle file upload for warehouse receipts, keeping a temp copy for processing
   */
  async handleReceiptUpload(file: Express.Multer.File): Promise<{
    filePath: string;
    fileName: string;
    fileType: string;
    fileUrl?: string;
  }> {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Please upload an image, PDF, CSV, or Excel file.');
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File is too large. Maximum size is 10MB.');
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
    await this.ensureDirectoryExists(uploadsDir);
    
    // Save temporary file for processing
    return this.saveUploadedFile(file, true);
  }

  /**
   * Save a permanent copy of the uploaded receipt as an attachment
   */
  async saveReceiptAttachment(file: Express.Multer.File): Promise<string | null> {
    try {
      const result = await this.saveUploadedFile(file, false);
      return result.fileUrl || null;
    } catch (error) {
      console.error('Error saving receipt attachment:', error);
      return null;
    }
  }

  /**
   * Create receipt attachment from existing temp file
   */
  async createAttachmentFromTempFile(tempFilePath: string): Promise<string | null> {
    try {
      // Read the original file
      const fileBuffer = await fsPromises.readFile(tempFilePath);
      
      // Get original filename and extension
      const fileExtension = path.extname(tempFilePath);
      const timestamp = Date.now().toString();
      const hashedName = crypto
        .createHash('md5')
        .update(tempFilePath + timestamp)
        .digest('hex');
      
      const fileName = `${hashedName}${fileExtension}`;
      const permanentPath = path.join(this.receiptAttachmentsDir, fileName);
      
      // Save as permanent file
      await fsPromises.writeFile(permanentPath, fileBuffer);
      
      // Return the URL
      return `/api/receipts/attachments/${fileName}`;
    } catch (error) {
      console.error('Error creating attachment from temp file:', error);
      return null;
    }
  }

  /**
   * Get the path to an attachment file by filename
   */
  getAttachmentPath(filename: string): string {
    return path.join(this.receiptAttachmentsDir, filename);
  }

  /**
   * Delete a file from disk
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export default new FileUploadService();