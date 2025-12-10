import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class R2Service {
  private client: S3Client;
  private bucketName: string;
  private baseUrl: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    // Use R2_PUBLIC_URL if available, otherwise fallback to R2 dev URL
    const publicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_PUBLIC_URL;
    this.baseUrl = publicUrl
      ? publicUrl.replace(/\/$/, '')
      : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    });
  }

  /**
   * Generate presigned URL for direct upload from client
   */
  async generatePresignedUrl(key: string, contentType: string, expiresIn: number = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return {
        uploadUrl: url,
        key,
        mediaUrl: `${this.baseUrl}/${key}`,
      };
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
      return { success: true, key };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Get permanent URL for a key
   */
  getPermanentUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

/**
 * Initialize R2 service from environment variables
 * Uses lazy initialization to avoid crashes at module load time
 */
export function initializeR2Service(): R2Service {
  const config = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.CLOUDFLARE_BUCKET_NAME || process.env.R2_BUCKET_NAME || '',
  };

  // Validate config
  const missing: string[] = [];
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      missing.push(key.toUpperCase());
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}. ` +
      `Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, and CLOUDFLARE_BUCKET_NAME`
    );
  }

  return new R2Service(config);
}

let r2ServiceInstance: R2Service | null = null;

/**
 * Lazy getter for R2 service - initializes only when first accessed
 */
export function getR2Service(): R2Service {
  if (!r2ServiceInstance) {
    r2ServiceInstance = initializeR2Service();
  }
  return r2ServiceInstance;
}

// For backwards compatibility, export as direct reference (lazy)
export const r2Service = new Proxy({} as R2Service, {
  get: (target, prop) => {
    const service = getR2Service();
    return (service as any)[prop];
  },
});
