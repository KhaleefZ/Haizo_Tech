import type { NextFunction, Request, Response } from 'express';
import { supportService } from '../services/support.service.js';
import type { PostSupportMessage, StartSupport, UpdateSupportSession } from '@haizo/types';
import { unauthenticated } from '../lib/errors.js';

// --- Visitor (public / visitor-token) ---

export function supportAvailability(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(supportService.availability());
  } catch (err) {
    next(err);
  }
}

export async function startSupportSession(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await supportService.start((req.body ?? {}) as StartSupport));
  } catch (err) {
    next(err);
  }
}

export async function getSupportThread(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.visitor) throw unauthenticated();
    res.json(await supportService.thread(req.visitor.sessionId));
  } catch (err) {
    next(err);
  }
}

export async function postSupportMessage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.visitor) throw unauthenticated();
    // The session comes from the TOKEN, never the request — a visitor can only
    // ever act on their own session.
    const { body, clientNonce } = req.body as PostSupportMessage;
    res.json(await supportService.postVisitorMessage(req.visitor.sessionId, body, clientNonce ?? null));
  } catch (err) {
    next(err);
  }
}

// --- Admin (staff) ---

export async function adminListSupportSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json(await supportService.listSessions(status));
  } catch (err) {
    next(err);
  }
}

export async function adminGetSupportSession(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await supportService.getSession(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function adminReplySupport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const { body, clientNonce } = req.body as PostSupportMessage;
    res.json(await supportService.reply(String(req.params.id), req.user.id, body, clientNonce ?? null));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateSupportSession(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await supportService.updateSession(String(req.params.id), req.body as UpdateSupportSession));
  } catch (err) {
    next(err);
  }
}
