import { Response, NextFunction } from 'express';
import { getR2Service } from '../services/r2.service';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  size: number;
}

/**
 * Generate presigned URL for direct upload to R2
 * Client will use this URL to upload file directly
 */
export const getPresignedUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filename, contentType, size } = req.body as PresignedUrlRequest;

    // Validation
    if (!filename || !contentType) {
      throw new AppError('filename and contentType are required', 400);
    }

    // Allow all content types - no restriction

    // Max file size: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (size > maxSize) {
      throw new AppError('File size exceeds 50MB limit', 400);
    }

    // Generate unique key with timestamp and user ID
    const timestamp = Date.now();
    const ext = filename.split('.').pop();
    const key = `uploads/${req.user!.id}/${timestamp}-${filename}`;

    // Generate presigned URL
    const r2Service = getR2Service();
    const { uploadUrl, mediaUrl } = await r2Service.generatePresignedUrl(
      key,
      contentType,
      3600 // 1 hour expiry
    );

    res.json({
      success: true,
      data: {
        uploadUrl,
        mediaUrl,
        key,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm upload and return permanent URL
 * This is called after successful client-side upload to R2
 */
export const confirmUpload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { key } = req.body;

    if (!key) {
      throw new AppError('key is required', 400);
    }

    // Verify key belongs to current user (security check)
    if (!key.includes(req.user!.id)) {
      throw new AppError('Invalid key or unauthorized access', 403);
    }

    const r2Service = getR2Service();
    const url = r2Service.getPermanentUrl(key);

    res.json({
      success: true,
      data: {
        url,
        key,
        filename: key.split('/').pop(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete media from R2
 */
export const deleteMedia = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    if (!key) {
      throw new AppError('key is required', 400);
    }

    // Verify key belongs to current user or user is admin
    if (!key.includes(req.user!.id) && req.user!.role !== 'admin') {
      throw new AppError('Not authorized to delete this media', 403);
    }

    const r2Service = getR2Service();
    await r2Service.deleteFile(key);

    res.json({
      success: true,
      message: 'Media deleted successfully',
      data: { key },
    });
  } catch (error) {
    next(error);
  }
};
