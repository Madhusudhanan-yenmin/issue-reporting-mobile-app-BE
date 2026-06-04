import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (
      cloudName && cloudName !== 'your_cloud_name' &&
      apiKey && apiKey !== 'your_api_key' &&
      apiSecret && apiSecret !== 'your_api_secret'
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary successfully configured');
    } else {
      this.logger.warn('Cloudinary credentials not set or set to defaults. Using mock image uploading fallback.');
    }
  }

  async uploadFile(file: Express.Multer.File, req?: any): Promise<{ secure_url: string }> {
    if (!this.isConfigured) {
      try {
        const uploadDir = join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        const fileExt = file.originalname.split('.').pop() || 'jpg';
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
        const filePath = join(uploadDir, uniqueFilename);

        writeFileSync(filePath, file.buffer);

        const protocol = req?.secure ? 'https' : 'http';
        const host = req?.headers?.host || 'localhost:3000';
        const localUrl = `${protocol}://${host}/uploads/${uniqueFilename}`;

        this.logger.log(`File saved locally: ${filePath}. Available at: ${localUrl}`);
        return { secure_url: localUrl };
      } catch (err: any) {
        this.logger.error('Failed to save file locally, falling back to mock Picsum URL', err);
        const randomSeed = Math.floor(Math.random() * 1000);
        return {
          secure_url: `https://picsum.photos/seed/${randomSeed}/800/600`,
        };
      }
    }

    return new Promise((resolve, reject) => {
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      cloudinary.uploader.upload(
        base64File,
        { folder: 'issue-reporting' },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload response was empty'));
          }
          resolve({ secure_url: result.secure_url });
        },
      );
    });
  }

  async uploadMultipleFiles(files: Express.Multer.File[], req?: any): Promise<{ secure_url: string }[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, req));
    return Promise.all(uploadPromises);
  }
}
