import type { NextFunction, Request, Response } from 'express';
import { contentService } from '../services/content.service.js';

export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    // Defaults are declared in the spec; the validator has already coerced and
    // range-checked anything present, so this is just the fallback.
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(await contentService.listServices(page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function getServiceBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await contentService.getServiceBySlug(String(req.params.slug)));
  } catch (err) {
    next(err);
  }
}

export async function listWorkCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await contentService.listWorkCategories());
  } catch (err) {
    next(err);
  }
}
