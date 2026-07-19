/**
 * Local-disk storage for uploads.
 *
 * The app runs on a single VPS (Hostinger KVM) with persistent disk, so uploaded
 * files are written under `uploadsDir` and served back as static files at
 * `config.uploadsPublicUrl`. There is no external object store — one machine
 * holds the app and its uploads, which is all this deployment needs.
 *
 * Files stream in through the API (multer, in memory) and are written straight to
 * disk here. A 10MB cap keeps a single request from parking a large buffer.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';

/**
 * Absolute directory where uploaded files live. Relative UPLOADS_DIR is resolved
 * against the process cwd; an absolute value (e.g. a mounted volume) is used
 * as-is. Created lazily on first write.
 */
export const uploadsDir = path.isAbsolute(config.uploadsDir)
  ? config.uploadsDir
  : path.resolve(process.cwd(), config.uploadsDir);

/**
 * Write bytes for `key` (a relative path like `<uuid>/photo.png`) under the
 * uploads directory, creating any parent folders. `key` is server-generated, so
 * it can't traverse out of the directory.
 */
export async function saveFile(key: string, body: Buffer): Promise<void> {
  const dest = path.join(uploadsDir, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, body);
}

/** The public URL a browser loads the stored file from. */
export function publicUrl(key: string): string {
  return `${config.uploadsPublicUrl.replace(/\/$/, '')}/${key}`;
}
