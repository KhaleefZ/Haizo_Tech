import type { NextFunction, Request, Response } from 'express';
import { projectService } from '../services/project.service.js';
import type {
  CreateColumn,
  CreateProject,
  CreateTask,
  UpdateColumn,
  UpdateProject,
  UpdateTask,
} from '@haizo/types';

/* ---- Projects ---- */

export async function adminListProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    res.json(await projectService.listProjects(page, pageSize));
  } catch (err) {
    next(err);
  }
}

export async function adminGetProject(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await projectService.getProject(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function adminCreateProject(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await projectService.createProject(req.body as CreateProject));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateProject(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await projectService.updateProject(String(req.params.id), req.body as UpdateProject));
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/* ---- Columns ---- */

export async function adminCreateColumn(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await projectService.createColumn(String(req.params.id), req.body as CreateColumn));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateColumn(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await projectService.updateColumn(String(req.params.id), req.body as UpdateColumn));
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteColumn(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteColumn(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/* ---- Tasks ---- */

export async function adminCreateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.user ? { id: req.user.id, name: req.user.name } : undefined;
    res
      .status(201)
      .json(await projectService.createTask(String(req.params.id), req.body as CreateTask, actor));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.user ? { id: req.user.id, name: req.user.name } : undefined;
    res.json(await projectService.updateTask(String(req.params.id), req.body as UpdateTask, actor));
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteTask(String(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
