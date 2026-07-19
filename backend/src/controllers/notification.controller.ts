import type { NextFunction, Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { unauthenticated } from '../lib/errors.js';

export async function adminListNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const limit = Number(req.query.limit ?? 20);
    res.json(await notificationService.list(req.user.id, cursor, limit));
  } catch (err) {
    next(err);
  }
}

export async function adminUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json({ count: await notificationService.unreadCount(req.user.id) });
  } catch (err) {
    next(err);
  }
}

export async function adminMarkNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    await notificationService.markRead(String(req.params.id), req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function adminMarkAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    await notificationService.markAllRead(req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    await notificationService.remove(String(req.params.id), req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
