import type { NextFunction, Request, Response } from 'express';
import type { CreateAnnouncement, UpdateAnnouncement } from '@haizo/types';
import { announcementService } from '../services/announcement.service.js';
import { unauthenticated } from '../lib/errors.js';

export async function adminListAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(await announcementService.list(page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function adminCreateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res
      .status(201)
      .json(await announcementService.create(req.body as CreateAnnouncement, req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await announcementService.update(String(req.params.id), req.body as UpdateAnnouncement),
    );
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    await announcementService.remove(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
