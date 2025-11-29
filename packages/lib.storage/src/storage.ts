import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { s3Client, getS3Config } from './client';
import type { FileMetadata } from './types';

/**
 * Delete a single file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getS3Config();

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(
  keys: string[]
): Promise<{ deleted: string[]; errors: Array<{ key: string; error: string }> }> {
  const config = getS3Config();

  if (keys.length === 0) {
    return { deleted: [], errors: [] };
  }

  // S3 limits batch deletes to 1000 objects
  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }

  const deleted: string[] = [];
  const errors: Array<{ key: string; error: string }> = [];

  for (const batch of batches) {
    const response = await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: false,
        },
      })
    );

    if (response.Deleted) {
      deleted.push(...response.Deleted.map((d) => d.Key!).filter(Boolean));
    }
    if (response.Errors) {
      errors.push(
        ...response.Errors.map((e) => ({
          key: e.Key!,
          error: e.Message ?? 'Unknown error',
        }))
      );
    }
  }

  return { deleted, errors };
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(key: string): Promise<boolean> {
  const metadata = await getFileMetadata(key);
  return metadata !== null;
}

/**
 * Get metadata for a file
 */
export async function getFileMetadata(key: string): Promise<FileMetadata | null> {
  const config = getS3Config();

  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );

    return {
      key,
      size: response.ContentLength ?? 0,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * List files in storage with a given prefix
 */
export async function listFiles(
  prefix: string,
  options: { maxKeys?: number; continuationToken?: string } = {}
): Promise<{ files: FileMetadata[]; nextToken?: string; isTruncated: boolean }> {
  const config = getS3Config();
  const { maxKeys = 100, continuationToken } = options;

  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    })
  );

  const files = (response.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified,
    etag: obj.ETag,
  }));

  return {
    files,
    nextToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated ?? false,
  };
}
