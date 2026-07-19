import type { NextFunction, Request, Response } from 'express';
import type { UpdateProfile } from '@haizo/types';
import { profileService } from '../services/profile.service.js';
import { setSessionCookies } from '../lib/auth/cookies.js';
import { unauthenticated } from '../lib/errors.js';

export async function adminGetProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await profileService.getProfile(req.user.id));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    res.json(await profileService.updateProfile(req.user.id, req.body as UpdateProfile));
  } catch (err) {
    next(err);
  }
}

export async function adminChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw unauthenticated();
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const tokens = await profileService.changePassword(req.user.id, currentPassword, newPassword);
    // Rotate the session so the change takes effect without a logout.
    setSessionCookies(res, tokens);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
