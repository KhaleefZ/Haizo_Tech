import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';

/** Unmatched routes must still return the standard error shape, not Express HTML. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError('NOT_FOUND', `No route matches ${req.method} ${req.path}`));
}
