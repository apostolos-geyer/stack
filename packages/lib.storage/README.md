# @_/lib.storage

S3-compatible storage with presigned URLs.

## Purpose

File uploads via presigned URLs. Works with AWS S3, Minio, or any S3-compatible service.

## Exports

```typescript
import { createPresigned, deleteFile, getPublicUrl } from '@_/lib.storage';
```

## Usage

```typescript
// Generate presigned upload URL
const { url, key, headers } = await createPresigned({
  filename: 'avatar.png',
  contentType: 'image/png',
  directory: 'uploads/user-123',
});

// Client uploads directly to S3 using the presigned URL
await fetch(url, {
  method: 'PUT',
  body: file,
  headers,
});

// Get public URL for the uploaded file
const publicUrl = getPublicUrl(key);
```

## Environment

Requires S3-compatible env vars (endpoint, bucket, access key, secret key).
