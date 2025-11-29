import type { ValidationOptions, ValidationResult } from './types';

/** Common MIME type groups for convenience */
export const MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
} as const;

/** Common size limits for convenience */
export const SIZE_LIMITS = {
  avatar: 5 * 1024 * 1024, // 5MB
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  video: 500 * 1024 * 1024, // 500MB
} as const;

/**
 * Validate a file before upload
 */
export function validateFile(
  file: { name: string; type: string; size: number },
  options: ValidationOptions = {}
): ValidationResult {
  const { maxSize, allowedTypes } = options;

  // Check file size
  if (maxSize !== undefined && file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatBytes(file.size)}) exceeds maximum allowed (${formatBytes(maxSize)})`,
    };
  }

  // Check MIME type
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((allowed) => {
      // Support wildcard types like "image/*"
      if (allowed.endsWith('/*')) {
        const category = allowed.slice(0, -2);
        return file.type.startsWith(category + '/');
      }
      return file.type === allowed;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getExtension(filename: string): string | null {
  const match = filename.match(/\.([^.]+)$/);
  return match ? `.${match[1]}` : null;
}

/**
 * Infer MIME type from filename (basic implementation)
 */
export function inferMimeType(filename: string): string | null {
  const ext = getExtension(filename)?.toLowerCase();
  if (!ext) return null;

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  };

  return mimeMap[ext] ?? null;
}
