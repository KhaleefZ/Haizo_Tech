import type { NextFunction, Request, Response } from 'express';
import { clientService } from '../services/client.service.js';
import type { CreateClient, UpdateClient } from '@haizo/types';

export async function adminListClients(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(await clientService.listClients(page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function adminGetClient(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await clientService.getClient(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function adminCreateClient(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await clientService.createClient(req.body as CreateClient));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateClient(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await clientService.updateClient(String(req.params.id), req.body as UpdateClient));
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await clientService.deleteClient(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
