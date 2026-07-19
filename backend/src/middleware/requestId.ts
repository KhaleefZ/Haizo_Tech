/**
 * Attaches a request id and echoes it back. Every error response carries the same
 * id, so a user reporting "it failed" gives you the exact log line.
 *
 * The `Request.id` type comes from pino-http's own Express augmentation (`ReqId`,
 * i.e. `string | number`). We deliberately do NOT re-declare it here — two
 * differing global augmentations of the same property is a compile error, and
 * pino-http's is the one the logger actually reads. Call sites needing a string
 * coerce with `String(req.id)`.
 */
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id');
  // Length-capped: an inbound header is attacker-controlled and ends up in logs.
  req.id = incoming && incoming.length > 0 && incoming.length <= 100 ? incoming : randomUUID();
  res.setHeader('X-Request-Id', String(req.id));
  next();
}
