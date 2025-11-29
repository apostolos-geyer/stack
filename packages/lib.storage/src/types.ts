export type PresignedUploadOptions = {
  /** Original filename */
  filename: string;
  /** MIME type of the file */
  contentType: string;
  /** Directory/prefix for the file (e.g., "uploads/user123") */
  directory?: string;
  /** URL expiration in seconds (default: 3600) */
  expiresIn?: number;
};

export type PresignedUploadResult = {
  /** The presigned PUT URL to upload to */
  url: string;
  /** The storage key where the file will be stored */
  key: string;
  /** Headers that must be sent with the upload request */
  headers: Record<string, string>;
  /** URL expiration timestamp */
  expiresAt: Date;
};

export type PresignedDownloadResult = {
  /** The presigned GET URL */
  url: string;
  /** URL expiration timestamp */
  expiresAt: Date;
};

export type FileMetadata = {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
};

export type ValidationOptions = {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allowed MIME types (e.g., ['image/png', 'image/jpeg']) */
  allowedTypes?: string[];
};

export type ValidationResult = {
  valid: boolean;
  error?: string;
};
