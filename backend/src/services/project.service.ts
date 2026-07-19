import { Prisma } from '@prisma/client';
import type {
  AdminProjectDetail,
  AdminProjectList,
  AdminProjectListItem,
  BoardColumn,
  BoardTask,
  CreateColumn,
  CreateProject,
  CreateTask,
  TaskPriority,
  UpdateColumn,
  UpdateProject,
  UpdateTask,
} from '@haizo/types';
import { projectRepository } from '../repositories/project.repository.js';
import { notFound } from '../lib/errors.js';

type DetailRow = NonNullable<Awaited<ReturnType<typeof projectRepository.findProjectDetail>>>;
type ColumnRow = NonNullable<Awaited<ReturnType<typeof projectRepository.updateColumn>>>;
type TaskRow = NonNullable<Awaited<ReturnType<typeof projectRepository.findTaskById>>>;
type ListRow = Awaited<ReturnType<typeof projectRepository.listProjects>>[0][number];

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

function toBoardTask(t: TaskRow | ColumnRow['tasks'][number]): BoardTask {
  return {
    id: t.id,
    columnId: t.columnId,
    title: t.title,
    description: t.description,
    priority: t.priority as TaskPriority,
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name ?? null,
    dueDate: iso(t.dueDate),
    isCompleted: t.isCompleted,
    order: t.order,
  };
}

function toBoardColumn(c: DetailRow['columns'][number] | ColumnRow): BoardColumn {
  return { id: c.id, name: c.name, order: c.order, tasks: c.tasks.map(toBoardTask) };
}

function toProjectDetail(p: DetailRow): AdminProjectDetail {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    clientId: p.clientId,
    clientName: p.client?.organization ?? null,
    status: p.status,
    progress: p.progress,
    budget: p.budget,
    startDate: iso(p.startDate),
    endDate: iso(p.endDate),
    createdAt: p.createdAt.toISOString(),
    columns: p.columns.map(toBoardColumn),
  };
}

function toProjectListItem(p: ListRow): AdminProjectListItem {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    clientId: p.clientId,
    clientName: p.client?.organization ?? null,
    taskCount: p.columns.reduce((sum, c) => sum + c._count.tasks, 0),
    createdAt: p.createdAt.toISOString(),
  };
}

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

export const projectService = {
  async listProjects(page: number, pageSize: number): Promise<AdminProjectList> {
    const [rows, total] = await projectRepository.listProjects({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const totalPages = Math.ceil(total / pageSize);
    return {
      data: rows.map(toProjectListItem),
      meta: { page, pageSize, total, totalPages, hasNext: page < totalPages },
    };
  },

  async getProject(id: string): Promise<AdminProjectDetail> {
    const row = await projectRepository.findProjectDetail(id);
    if (!row) throw notFound('Project');
    return toProjectDetail(row);
  },

  async createProject(input: CreateProject): Promise<AdminProjectDetail> {
    const row = await projectRepository.createProject({
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? 'Planning',
      budget: input.budget ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      ...(input.clientId ? { client: { connect: { id: input.clientId } } } : {}),
      // A new project starts with a usable board.
      columns: { create: DEFAULT_COLUMNS.map((name, order) => ({ name, order })) },
    });
    return toProjectDetail(row);
  },

  async updateProject(id: string, input: UpdateProject): Promise<AdminProjectDetail> {
    const existing = await projectRepository.findProjectDetail(id);
    if (!existing) throw notFound('Project');

    const data: Prisma.ProjectUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.progress !== undefined ? { progress: input.progress } : {}),
      ...(input.budget !== undefined ? { budget: input.budget } : {}),
      ...(input.startDate !== undefined
        ? { startDate: input.startDate ? new Date(input.startDate) : null }
        : {}),
      ...(input.endDate !== undefined
        ? { endDate: input.endDate ? new Date(input.endDate) : null }
        : {}),
      ...(input.clientId !== undefined
        ? input.clientId
          ? { client: { connect: { id: input.clientId } } }
          : { client: { disconnect: true } }
        : {}),
    };
    const row = await projectRepository.updateProject(id, data);
    return toProjectDetail(row);
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await projectRepository.deleteProject(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Project');
      }
      throw err;
    }
  },

  /* ---- Columns ---- */

  async createColumn(projectId: string, input: CreateColumn): Promise<BoardColumn> {
    const project = await projectRepository.findProjectDetail(projectId);
    if (!project) throw notFound('Project');
    const order = (await projectRepository.maxColumnOrder(projectId)) + 1;
    const row = await projectRepository.createColumn({
      name: input.name,
      order,
      project: { connect: { id: projectId } },
    });
    return toBoardColumn(row);
  },

  async updateColumn(id: string, input: UpdateColumn): Promise<BoardColumn> {
    const existing = await projectRepository.findColumnById(id);
    if (!existing) throw notFound('Column');
    const row = await projectRepository.updateColumn(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
    });
    return toBoardColumn(row);
  },

  async deleteColumn(id: string): Promise<void> {
    try {
      await projectRepository.deleteColumn(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Column');
      }
      throw err;
    }
  },

  /* ---- Tasks ---- */

  async createTask(columnId: string, input: CreateTask): Promise<BoardTask> {
    const column = await projectRepository.findColumnById(columnId);
    if (!column) throw notFound('Column');
    const order = (await projectRepository.maxTaskOrder(columnId)) + 1;
    const row = await projectRepository.createTask({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'Low',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      order,
      column: { connect: { id: columnId } },
      ...(input.assigneeId ? { assignee: { connect: { id: input.assigneeId } } } : {}),
    });
    return toBoardTask(row);
  },

  async updateTask(id: string, input: UpdateTask): Promise<BoardTask> {
    const existing = await projectRepository.findTaskById(id);
    if (!existing) throw notFound('Task');

    const data: Prisma.TaskUpdateInput = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.isCompleted !== undefined ? { isCompleted: input.isCompleted } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...(input.assigneeId !== undefined
        ? input.assigneeId
          ? { assignee: { connect: { id: input.assigneeId } } }
          : { assignee: { disconnect: true } }
        : {}),
    };

    // A move: reattach to the target column, appended to its end unless an
    // explicit order is given.
    if (input.columnId !== undefined && input.columnId !== existing.columnId) {
      const target = await projectRepository.findColumnById(input.columnId);
      if (!target) throw notFound('Column');
      data.column = { connect: { id: input.columnId } };
      data.order = input.order ?? (await projectRepository.maxTaskOrder(input.columnId)) + 1;
    } else if (input.order !== undefined) {
      data.order = input.order;
    }

    const row = await projectRepository.updateTask(id, data);
    return toBoardTask(row);
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await projectRepository.deleteTask(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw notFound('Task');
      }
      throw err;
    }
  },
};
