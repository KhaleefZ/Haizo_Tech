import { randomUUID } from 'node:crypto';
import type { UploadResponse } from '@haizo/types';
import { uploadRepository } from '../repositories/upload.repository.js';
import { saveFile, publicUrl } from '../lib/storage.js';
import { validationFailed } from '../lib/errors.js';

// Server-side allowlist — the browser can lie about type, so this is the source
// of truth for what we'll persist and later serve.
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** Keep the original name readable but safe as a path segment. */
function safeName(filename: string): string {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'file'
  );
}

export interface UploadInput {
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export const uploadService = {
  /** Validate, write to disk, and record a READY Attachment. */
  async upload(input: UploadInput, userId: string): Promise<UploadResponse> {
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw validationFailed([{ path: 'file', message: 'Unsupported file type' }]);
    }
    if (input.size > MAX_SIZE) {
      throw validationFailed([{ path: 'file', message: 'File too large (max 10MB)' }]);
    }

    // A per-file uuid folder means two uploads of the same name never collide.
    const key = `${randomUUID()}/${safeName(input.filename)}`;
    await saveFile(key, input.buffer);

    const attachment = await uploadRepository.create({
      key,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      status: 'READY',
      uploadedById: userId,
    });

    return { attachmentId: attachment.id, url: publicUrl(key) };
  },
};
