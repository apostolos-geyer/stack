// S3 client
export { s3Client, getS3Config } from './client';

// Presigned URLs
export {
  createPresignedUpload,
  createPresignedDownload,
  getPublicUrl,
  isOurStorage,
  extractKeyFromUrl,
} from './presign';

// Storage operations
export { deleteFile, deleteFiles, fileExists, getFileMetadata, listFiles } from './storage';

// Validation
export {
  validateFile,
  formatBytes,
  getExtension,
  inferMimeType,
  MIME_TYPES,
  SIZE_LIMITS,
} from './validation';

// Types
export type * from './types';
