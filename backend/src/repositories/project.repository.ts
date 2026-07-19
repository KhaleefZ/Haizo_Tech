/**
 * All DB access for projects and their kanban boards (columns + tasks).
 * Deleting a project cascades to columns and tasks via the schema's onDelete.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const CLIENT_SELECT = { client: { select: { organization: true } } } as const;

const BOARD_INCLUDE = {
  ...CLIENT_SELECT,
  columns: {
    orderBy: { order: 'asc' as const },
    include: {
      tasks: {
        orderBy: { order: 'asc' as const },
        include: { assignee: { select: { name: true } } },
      },
    },
  },
} as const;

const TASK_INCLUDE = {
  column: { select: { projectId: true } },
  assignee: { select: { name: true } },
} as const;

const COLUMN_INCLUDE = {
  tasks: {
    orderBy: { order: 'asc' as const },
    include: { assignee: { select: { name: true } } },
  },
} as const;

export const projectRepository = {
  /* ---- Projects ---- */

  listProjects({ skip, take }: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { ...CLIENT_SELECT, columns: { select: { _count: { select: { tasks: true } } } } },
      }),
      prisma.project.count(),
    ]);
  },

  findProjectDetail(id: string) {
    return prisma.project.findUnique({ where: { id }, include: BOARD_INCLUDE });
  },

  createProject(data: Prisma.ProjectCreateInput) {
    return prisma.project.create({ data, include: BOARD_INCLUDE });
  },

  updateProject(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({ where: { id }, data, include: BOARD_INCLUDE });
  },

  deleteProject(id: string) {
    return prisma.project.delete({ where: { id } });
  },

  /* ---- Columns ---- */

  async maxColumnOrder(projectId: string): Promise<number> {
    const top = await prisma.column.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return top?.order ?? -1;
  },

  createColumn(data: Prisma.ColumnCreateInput) {
    return prisma.column.create({ data, include: COLUMN_INCLUDE });
  },

  findColumnById(id: string) {
    return prisma.column.findUnique({ where: { id } });
  },

  updateColumn(id: string, data: Prisma.ColumnUpdateInput) {
    return prisma.column.update({ where: { id }, data, include: COLUMN_INCLUDE });
  },

  deleteColumn(id: string) {
    return prisma.column.delete({ where: { id } });
  },

  /* ---- Tasks ---- */

  async maxTaskOrder(columnId: string): Promise<number> {
    const top = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return top?.order ?? -1;
  },

  createTask(data: Prisma.TaskCreateInput) {
    return prisma.task.create({ data, include: TASK_INCLUDE });
  },

  findTaskById(id: string) {
    return prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  },

  updateTask(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({ where: { id }, data, include: TASK_INCLUDE });
  },

  deleteTask(id: string) {
    return prisma.task.delete({ where: { id } });
  },
};
