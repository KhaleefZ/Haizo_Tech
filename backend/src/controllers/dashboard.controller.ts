import type { NextFunction, Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

export async function adminGetDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await dashboardService.getDashboard());
  } catch (err) {
    next(err);
  }
}
