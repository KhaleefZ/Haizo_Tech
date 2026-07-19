import type { NextFunction, Request, Response } from 'express';
import type { InquiryStatus } from '@prisma/client';
import { inquiryService } from '../services/inquiry.service.js';

export async function adminListInquiries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const status = req.query.status ? (String(req.query.status) as InquiryStatus) : undefined;
    res.json(await inquiryService.listInquiries(page, pageSize, status));
  } catch (err) {
    next(err);
  }
}

export async function adminGetInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await inquiryService.getInquiry(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body as { status: InquiryStatus };
    res.json(await inquiryService.updateStatus(String(req.params.id), status));
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    await inquiryService.deleteInquiry(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
