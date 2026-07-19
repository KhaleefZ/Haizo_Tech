import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { userService } from '../services/user.service.js';
import { unauthenticated } from '../lib/errors.js';

export async function adminListUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userService.listUsers());
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const { role } = req.body as { role: Role };
    res.json(await userService.updateRole(String(req.params.id), role, req.user.id));
  } catch (err) {
    next(err);
  }
}
