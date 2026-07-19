import type { NextFunction, Request, Response } from 'express';
import { uploadService } from '../services/upload.service.js';
import { unauthenticated, validationFailed } from '../lib/errors.js';

/** The subset of a multer file we use. */
interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * express-openapi-validator's file uploader may expose the parsed file as
 * `req.file`, an array on `req.files`, or a `{ field: File[] }` map depending on
 * how it invokes multer — pull the `file` field out of whichever shape we get.
 */
function pickFile(req: Request): UploadedFile | undefined {
  const single = (req as Request & { file?: UploadedFile }).file;
  if (single) return single;

  const files = (req as Request & { files?: unknown }).files;
  if (Array.isArray(files)) {
    const arr = files as UploadedFile[];
    return arr.find((f) => f.fieldname === 'file') ?? arr[0];
  }
  if (files && typeof files === 'object') {
    const named = (files as Record<string, UploadedFile[]>).file;
    if (named?.length) return named[0];
  }
  return undefined;
}

export async function adminUpload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const file = pickFile(req);
    if (!file) throw validationFailed([{ path: 'file', message: 'A file is required' }]);

    res.json(
      await uploadService.upload(
        {
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        },
        req.user.id,
      ),
    );
  } catch (err) {
    next(err);
  }
}
