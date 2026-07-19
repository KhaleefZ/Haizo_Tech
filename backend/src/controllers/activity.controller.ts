import type { NextFunction, Request, Response } from 'express';
import { activityService } from '../services/activity.service.js';

export async function adminListActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 30);
    res.json(await activityService.list(page, pageSize));
  } catch (err) {
    next(err);
  }
}
