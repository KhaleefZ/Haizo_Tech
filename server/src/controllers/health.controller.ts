/**
 * Controllers do HTTP and nothing else: read the request, call one service, shape
 * the response. If logic starts appearing here, it belongs in the service.
 */
import type { NextFunction, Request, Response } from 'express';
import { healthService } from '../services/health.service.js';

export async function getHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await healthService.check());
  } catch (err) {
    next(err);
  }
}
