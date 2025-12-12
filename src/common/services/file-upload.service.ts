import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get('UPLOAD_DEST', './upload');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: any, subfolder: string = ''): Promise<string> {
    // Save directly to upload root, not in subfolder
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadPath, uniqueFileName);

    fs.writeFileSync(filePath, file.buffer);

    // Return full URL
    return `${this.baseUrl}/${uniqueFileName}`;
  }

  async saveFiles(files: any[], subfolder: string = ''): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const savedPaths: string[] = [];
    for (const file of files) {
      const path = await this.saveFile(file, subfolder);
      savedPaths.push(path);
    }
    return savedPaths;
  }

  async deleteFile(filePathOrUrl: string): Promise<void> {
    if (!filePathOrUrl) {
      return;
    }

    // Extract filename from URL if it's a full URL
    let fileName = filePathOrUrl;
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
      try {
        // Extract filename from URL
        // Examples:
        // http://localhost:3000/1234567890-123456789.jpg -> 1234567890-123456789.jpg
        // https://gpg-backend-vgrz.onrender.com/1234567890-123456789.jpg -> 1234567890-123456789.jpg
        // http://localhost:3000/upload/products/1234567890-123456789.jpg -> 1234567890-123456789.jpg
        const urlObj = new URL(filePathOrUrl);
        const pathname = urlObj.pathname;
        // Remove leading slash and any subfolder paths
        fileName = pathname.split('/').pop() || pathname.replace(/^\/+/, '');
      } catch (error) {
        // Fallback: simple split if URL parsing fails
        const urlParts = filePathOrUrl.split('/');
        fileName = urlParts[urlParts.length - 1];
      }
    } else if (filePathOrUrl.startsWith('/')) {
      // Handle relative paths like /upload/products/filename.jpg or /filename.jpg
      fileName = filePathOrUrl.split('/').pop() || filePathOrUrl.replace(/^\/+/, '');
    }
    
    if (!fileName) {
      console.warn(`Cannot extract filename from: ${filePathOrUrl}`);
      return;
    }

    const fullPath = path.join(this.uploadPath, fileName);
    
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted file: ${fullPath}`);
      } else {
        console.warn(`File not found: ${fullPath} (this is OK if file was already deleted)`);
      }
    } catch (error) {
      // Log error but don't throw - file might not exist or already deleted
      console.error(`Error deleting file ${fullPath}:`, error);
      // Don't throw - allow deletion to continue even if file deletion fails
    }
  }

  async updateFile(oldFilePath: string, newFile: any, subfolder: string = ''): Promise<string> {
    if (oldFilePath) {
      await this.deleteFile(oldFilePath);
    }
    return this.saveFile(newFile, subfolder);
  }

  async deleteFiles(filePaths: string[]): Promise<void> {
    if (!filePaths || filePaths.length === 0) {
      return;
    }
    for (const filePath of filePaths) {
      try {
        await this.deleteFile(filePath);
      } catch (error) {
        // Log error but continue deleting other files
        console.error(`Failed to delete file ${filePath}:`, error);
        // Don't throw - continue with other files
      }
    }
  }
}

