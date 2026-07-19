import type { NextFunction, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import type { RecordPageView } from '@haizo/types';

export async function recordPageView(req: Request, res: Response, next: NextFunction) {
  try {
    await analyticsService.recordPageView(req.body as RecordPageView);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function adminGetAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getAnalytics());
  } catch (err) {
    next(err);
  }
}
