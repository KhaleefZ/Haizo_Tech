import { randomUUID } from 'node:crypto';
import type { ConfirmResponse, PresignRequest, PresignResponse } from '@haizo/types';
import { uploadRepository } from '../repositories/upload.repository.js';
import { isStorageConfigured, presignPut, publicUrl } from '../lib/storage.js';
import { notFound, unavailable, validationFailed } from '../lib/errors.js';

// Server-side allowlist — the client can lie about type, but the presigned PUT
// is bound to this ContentType and these are the only ones we sign.
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** Keep the original name readable but safe as an object-key segment. */
function safeName(filename: string): string {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'file'
  );
}

export const uploadService = {
  async presign(input: PresignRequest, userId: string): Promise<PresignResponse> {
    if (!isStorageConfigured()) {
      throw unavailable('File uploads are not configured');
    }
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw validationFailed([{ path: 'mimeType', message: 'Unsupported file type' }]);
    }
    if (input.size > MAX_SIZE) {
      throw validationFailed([{ path: 'size', message: 'File too large (max 10MB)' }]);
    }

    const key = `uploads/${randomUUID()}/${safeName(input.filename)}`;
    const attachment = await uploadRepository.create({
      key,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      status: 'PENDING',
      uploadedById: userId,
    });
    const uploadUrl = await presignPut(key, input.mimeType);

    return { attachmentId: attachment.id, key, uploadUrl, publicUrl: publicUrl(key) };
  },

  async confirm(id: string): Promise<ConfirmResponse> {
    const attachment = await uploadRepository.findById(id);
    if (!attachment) throw notFound('Upload');
    await uploadRepository.markReady(id);
    return { publicUrl: publicUrl(attachment.key), status: 'READY' };
  },
};
