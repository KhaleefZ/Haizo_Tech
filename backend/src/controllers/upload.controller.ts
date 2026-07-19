import type { NextFunction, Request, Response } from 'express';
import { uploadService } from '../services/upload.service.js';
import type { PresignRequest } from '@haizo/types';
import { unauthenticated } from '../lib/errors.js';

export async function adminPresignUpload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await uploadService.presign(req.body as PresignRequest, req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminConfirmUpload(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await uploadService.confirm(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}
