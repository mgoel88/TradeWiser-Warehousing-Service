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

  constructor() {
    // Set upload directory - create it if it doesn't exist
    this.uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save an uploaded file to disk
   */
  async saveUploadedFile(file: Express.Multer.File): Promise<{
    filePath: string;
    fileName: string;
    fileType: string;
  }> {
    try {
      // Generate a unique filename to prevent collisions
      const fileExtension = path.extname(file.originalname);
      const hashedName = crypto
        .createHash('md5')
        .update(file.originalname + Date.now().toString())
        .digest('hex');
      
      const fileName = `${hashedName}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);
      
      // Write the file to disk
      await fsPromises.writeFile(filePath, file.buffer);
      
      return {
        filePath,
        fileName,
        fileType: file.mimetype
      };
    } catch (error) {
      console.error('Error saving uploaded file:', error);
      throw new Error(`Failed to save uploaded file: ${error.message}`);
    }
  }

  /**
   * Handle file upload for warehouse receipts
   */
  async handleReceiptUpload(file: Express.Multer.File): Promise<{
    filePath: string;
    fileName: string;
    fileType: string;
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
    
    // Save the file
    return this.saveUploadedFile(file);
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