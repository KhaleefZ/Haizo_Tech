import type { NextFunction, Request, Response } from 'express';
import { searchService } from '../services/search.service.js';

export async function adminSearch(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await searchService.search(String(req.query.q ?? '')));
  } catch (err) {
    next(err);
  }
}
