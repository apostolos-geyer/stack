import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getS3Config } from './client';
import type { PresignedUploadOptions, PresignedUploadResult, PresignedDownloadResult } from './types';

const DEFAULT_EXPIRES_IN = 3600; // 1 hour

/**
 * Generate a unique storage key for a file
 */
function generateKey(filename: string, directory?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const key = `${timestamp}-${random}-${safeFilename}`;

  return directory ? `${directory}/${key}` : key;
}

/**
 * Generate a presigned URL for uploading a file directly from the client
 */
export async function createPresignedUpload(
  options: PresignedUploadOptions
): Promise<PresignedUploadResult> {
  const config = getS3Config();
  const { filename, contentType, directory, expiresIn = DEFAULT_EXPIRES_IN } = options;

  const key = generateKey(filename, directory);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn,
    signableHeaders: new Set(['content-type']),
  });

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    url,
    key,
    headers: {
      'Content-Type': contentType,
    },
    expiresAt,
  };
}

/**
 * Generate a presigned URL for downloading a private file
 */
export async function createPresignedDownload(
  key: string,
  expiresIn = DEFAULT_EXPIRES_IN
): Promise<PresignedDownloadResult> {
  const config = getS3Config();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return { url, expiresAt };
}

/**
 * Get a public URL for a file (for public buckets/objects)
 * This is just string concatenation - zero cost, no API call
 */
export function getPublicUrl(key: string): string {
  const config = getS3Config();

  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/$/, '')}/${key}`;
  }

  if (config.endpoint) {
    return `${config.endpoint}/${config.bucket}/${key}`;
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

/**
 * Get the base URL prefix for our storage
 * Returns null if S3 is not configured
 */
function getStorageUrlPrefix(): string | null {
  const config = getS3Config();

  if (config.publicUrl) {
    return config.publicUrl.replace(/\/$/, '');
  }

  if (config.endpoint) {
    return `${config.endpoint}/${config.bucket}`;
  }

  if (config.bucket && config.region) {
    return `https://${config.bucket}.s3.${config.region}.amazonaws.com`;
  }

  return null;
}

/**
 * Check if a URL belongs to our S3 storage
 * Useful for determining if we should delete a file when replacing it
 */
export function isOurStorage(url: string): boolean {
  const prefix = getStorageUrlPrefix();
  return !!prefix && url.startsWith(prefix);
}

/**
 * Extract the storage key from a URL
 * Returns null if the URL doesn't belong to our storage
 */
export function extractKeyFromUrl(url: string): string | null {
  const prefix = getStorageUrlPrefix();
  if (!prefix || !url.startsWith(prefix)) {
    return null;
  }
  return url.slice(prefix.length + 1); // +1 for the trailing slash
}
