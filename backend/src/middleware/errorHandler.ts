/**
 * The single exit point for every failure.
 *
 * Three things matter here:
 *  1. One response shape, always — matching the `Error` schema in openapi.yaml.
 *  2. Unexpected errors never leak internals to the client. The message is
 *     generic; the detail goes to the log with the request id.
 *  3. express-openapi-validator's errors are translated rather than passed
 *     through, so spec validation failures look like every other 400.
 */
import type { NextFunction, Request, Response } from 'express';
import { AppError, internal, validationFailed } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { ErrorDetail } from '@haizo/types';

interface OpenApiValidationError {
  status: number;
  errors?: Array<{ path?: string; message?: string }>;
  message?: string;
}

function isOpenApiError(err: unknown): err is OpenApiValidationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    Array.isArray((err as OpenApiValidationError).errors)
  );
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Express identifies error handlers by arity — `next` must stay in the signature.
  _next: NextFunction,
) {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (isOpenApiError(err) && err.status >= 400 && err.status < 500) {
    // Preserve the validator's status rather than flattening everything to 400.
    // A request for a path the spec doesn't declare is a 404, not a malformed
    // body, and clients branch on that difference.
    if (err.status === 404) {
      appError = new AppError('NOT_FOUND', err.message || 'No such route');
    } else if (err.status === 401) {
      appError = new AppError('UNAUTHENTICATED', 'You need to sign in to do that');
    } else if (err.status === 403) {
      appError = new AppError('FORBIDDEN', 'You do not have access to that');
    } else {
      const details: ErrorDetail[] = (err.errors ?? []).map((e) => ({
        // The validator reports JSON pointers like "/body/email"; trim to "email".
        path: (e.path ?? '').replace(/^\/(body|query|params)\/?/, '') || '(request)',
        message: e.message ?? 'Invalid value',
      }));
      appError = validationFailed(details);
    }
  } else {
    appError = internal(err);
  }

  if (appError.expected) {
    logger.warn({ requestId: String(req.id), code: appError.code, path: req.path }, appError.message);
  } else {
    logger.error(
      { requestId: String(req.id), path: req.path, err: appError.cause ?? err },
      'Unhandled error',
    );
  }

  res.status(appError.status).json(appError.toResponse(String(req.id)));
}
