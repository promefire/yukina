import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { createHash } from 'crypto';

export interface DownloadResult {
  success: boolean;
  localPath?: string;
  error?: string;
}

export class ImageDownloader {
  private baseDir: string;

  constructor(baseDir: string = 'public/images/douban') {
    this.baseDir = baseDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFileExtension(url: string): string {
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath);
    return ext || '.jpg';
  }

  private generateFileName(url: string, title: string): string {
    const hash = createHash('md5').update(url + title).digest('hex');
    const ext = this.getFileExtension(url);
    return `${hash}${ext}`;
  }

  async downloadImage(url: string, title: string): Promise<DownloadResult> {
    try {
      const fileName = this.generateFileName(url, title);
      const localPath = path.join(this.baseDir, fileName);
      const publicPath = `/images/douban/${fileName}`;

      // 检查文件是否已存在
      if (fs.existsSync(localPath)) {
        return { success: true, localPath: publicPath };
      }

      // 下载图片
      await this.downloadFile(url, localPath);
      return { success: true, localPath: publicPath };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private downloadFile(url: string, localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const request = client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 处理重定向
          if (response.headers.location) {
            this.downloadFile(response.headers.location, localPath)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(localPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (error) => {
          fs.unlink(localPath, () => {}); // 删除部分下载的文件
          reject(error);
        });
      });

      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}