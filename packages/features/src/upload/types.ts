export type PresignedUploadInput = {
  filename: string;
  contentType: string;
  directory?: string;
};

export type PresignedUploadResult = {
  /** Presigned URL for uploading */
  uploadUrl: string;
  /** Storage key where file will be stored */
  key: string;
  /** Public URL after upload completes */
  publicUrl: string;
  /** Headers required for the upload request */
  headers: Record<string, string>;
};

export type UploadResult = {
  /** Storage key for the uploaded file */
  key: string;
  /** Public URL to access the file */
  url: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
};

export type UploadStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'uploading'
  | 'uploaded'
  | 'error';

export type PreparedUpload = {
  /** The file to be uploaded */
  file: File;
  /** Storage key where file will be stored */
  key: string;
  /** Presigned URL for uploading */
  uploadUrl: string;
  /** Public URL after upload completes */
  publicUrl: string;
  /** Headers required for the upload request */
  headers: Record<string, string>;
};
