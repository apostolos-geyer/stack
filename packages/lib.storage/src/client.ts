import { S3Client } from '@aws-sdk/client-s3';
import { serverEnv } from '@_/platform/server';

const globalForS3 = globalThis as unknown as { s3Client: S3Client | undefined };

function createS3Client(): S3Client {
  return new S3Client({
    region: serverEnv.S3_REGION ?? 'auto',
    endpoint: serverEnv.S3_ENDPOINT,
    credentials: {
      accessKeyId: serverEnv.S3_ACCESS_KEY_ID!,
      secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for MinIO and some S3-compatible services
  });
}

export const s3Client = globalForS3.s3Client ?? createS3Client();

if (serverEnv.NODE_ENV !== 'production') {
  globalForS3.s3Client = s3Client;
}

export function getS3Config() {
  return {
    bucket: serverEnv.S3_BUCKET!,
    region: serverEnv.S3_REGION ?? 'auto',
    endpoint: serverEnv.S3_ENDPOINT,
    publicUrl: serverEnv.S3_PUBLIC_URL,
  };
}
