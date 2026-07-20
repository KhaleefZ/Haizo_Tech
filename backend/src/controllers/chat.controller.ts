import type { NextFunction, Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import type { OpenConversation, PostMessage } from '@haizo/types';
import { unauthenticated } from '../lib/errors.js';

export async function adminListChatContacts(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await chatService.listContacts(req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminListConversations(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await chatService.listConversations(req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminOpenConversation(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await chatService.open(req.body as OpenConversation, req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminListMessages(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const before = typeof req.query.before === 'string' ? req.query.before : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    res.json(await chatService.listMessages(String(req.params.id), req.user.id, before, limit));
  } catch (err) {
    next(err);
  }
}

export async function adminMarkConversationRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await chatService.markRead(String(req.params.id), req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminPostMessage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const { body, clientNonce, attachmentId } = req.body as PostMessage;
    res.json(
      await chatService.postMessage(
        String(req.params.id),
        req.user.id,
        body,
        clientNonce ?? null,
        attachmentId ?? null,
      ),
    );
  } catch (err) {
    next(err);
  }
}
