/**
 * Object storage (Cloudflare R2 / any S3-compatible endpoint).
 *
 * Uploads go DIRECT from the browser to the bucket via a short-lived presigned
 * PUT — the file never streams through this server, so a large image can't tie
 * up a request. The client then confirms, flipping the Attachment to READY.
 *
 * Fail-soft: without credentials, `isStorageConfigured()` is false and callers
 * return 503, so the app runs (with plain URL image fields) until R2 is wired.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';

let client: S3Client | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(
    config.s3Endpoint &&
      config.s3Bucket &&
      config.s3AccessKeyId &&
      config.s3SecretAccessKey &&
      config.s3PublicUrl,
  );
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint,
      credentials: {
        accessKeyId: config.s3AccessKeyId ?? '',
        secretAccessKey: config.s3SecretAccessKey ?? '',
      },
      // R2 and most S3-compatibles want path-style addressing.
      forcePathStyle: true,
    });
  }
  return client;
}

/** A short-lived presigned PUT the browser uploads the file to. */
export function presignPut(key: string, contentType: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: config.s3Bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

export function publicUrl(key: string): string {
  return `${(config.s3PublicUrl ?? '').replace(/\/$/, '')}/${key}`;
}
