/**
 * The one error shape this API returns.
 *
 * The previous backend returned `{ error: 'Failed to fetch notifications' }` from
 * some places and other shapes elsewhere, so clients could not branch on anything.
 * Here every failure — thrown, validation, or unexpected — converges on
 * `{ error: { code, message, details?, requestId? } }`, which is exactly the
 * `Error` schema in openapi.yaml.
 */
import type { ApiError, ErrorDetail } from '@haizo/types';

export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[] | undefined;
  /** True for errors we raised deliberately; false for genuine surprises. */
  readonly expected: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: { details?: ErrorDetail[]; cause?: unknown } = {},
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = options.details;
    this.expected = code !== 'INTERNAL';
  }

  toResponse(requestId?: string): ApiError {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    };
  }
}

/* Constructors — read better at call sites than `new AppError('NOT_FOUND', …)`. */

export const notFound = (what: string) => new AppError('NOT_FOUND', `${what} not found`);

export const unauthenticated = (message = 'You need to sign in to do that') =>
  new AppError('UNAUTHENTICATED', message);

export const forbidden = (message = 'You do not have access to that') =>
  new AppError('FORBIDDEN', message);

export const conflict = (message: string) => new AppError('CONFLICT', message);

export const validationFailed = (details: ErrorDetail[]) =>
  new AppError('VALIDATION_FAILED', 'Some fields need attention', { details });

export const internal = (cause: unknown) =>
  new AppError('INTERNAL', 'Something went wrong on our end', { cause });
