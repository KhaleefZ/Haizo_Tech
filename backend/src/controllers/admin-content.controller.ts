/**
 * Admin content HTTP layer. Request shape, ranges and required fields were
 * already enforced by the OpenAPI validator before we get here (that is this
 * project's "validation at the boundary" — the spec is the schema), so these
 * are thin: parse params, call the service, shape the status code.
 */
import type { NextFunction, Request, Response } from 'express';
import { adminContentService } from '../services/admin-content.service.js';
import type {
  CreateService,
  UpdateService,
  CreateIndustry,
  UpdateIndustry,
  CreateWorkCategory,
  UpdateWorkCategory,
} from '@haizo/types';

export async function adminListServices(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(await adminContentService.listServices(page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function adminGetService(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminContentService.getService(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function adminCreateService(req: Request, res: Response, next: NextFunction) {
  try {
    const created = await adminContentService.createService(req.body as CreateService);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateService(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await adminContentService.updateService(
      String(req.params.id),
      req.body as UpdateService,
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteService(req: Request, res: Response, next: NextFunction) {
  try {
    await adminContentService.deleteService(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/* ---- Industries ---- */

export async function adminListIndustries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(await adminContentService.listIndustries(page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function adminGetIndustry(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminContentService.getIndustry(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function adminCreateIndustry(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await adminContentService.createIndustry(req.body as CreateIndustry));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateIndustry(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await adminContentService.updateIndustry(String(req.params.id), req.body as UpdateIndustry),
    );
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteIndustry(req: Request, res: Response, next: NextFunction) {
  try {
    await adminContentService.deleteIndustry(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/* ---- Work categories ---- */

export async function adminListWorkCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminContentService.listWorkCategories());
  } catch (err) {
    next(err);
  }
}

export async function adminCreateWorkCategory(req: Request, res: Response, next: NextFunction) {
  try {
    res
      .status(201)
      .json(await adminContentService.createWorkCategory(req.body as CreateWorkCategory));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateWorkCategory(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await adminContentService.updateWorkCategory(
        String(req.params.id),
        req.body as UpdateWorkCategory,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteWorkCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await adminContentService.deleteWorkCategory(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
