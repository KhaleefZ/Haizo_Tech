'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Skeleton,
  Spinner,
  Textarea,
  cn,
  useToast,
} from '@haizo/ui';
import type { BoardColumn, BoardTask, TaskPriority, UpdateTask } from '@haizo/types';
import { api } from '../../../../lib/api';
import { ProjectForm } from '../../../../components/projects/ProjectForm';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

function priorityVariant(p: TaskPriority): 'danger' | 'warning' | 'neutral' {
  return p === 'High' ? 'danger' : p === 'Medium' ? 'warning' : 'neutral';
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('');
}

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const boardKey = ['admin', 'project', id] as const;
  const { data: project, isLoading, isError } = useQuery({
    queryKey: boardKey,
    queryFn: () => api.projects.get(id),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: boardKey });

  const { data: users } = useQuery({ queryKey: ['admin', 'users'], queryFn: () => api.users.list() });

  const [editingProject, setEditingProject] = React.useState(false);
  const [deletingProject, setDeletingProject] = React.useState(false);
  const [addingColumn, setAddingColumn] = React.useState(false);
  const [columnName, setColumnName] = React.useState('');
  const [openTask, setOpenTask] = React.useState<BoardTask | null>(null);
  const [dragTaskId, setDragTaskId] = React.useState<string | null>(null);

  const updateProject = useMutation({
    mutationFn: (p: Parameters<typeof api.projects.update>[1]) => api.projects.update(id, p),
    onSuccess: () => { refresh(); setEditingProject(false); toast({ variant: 'success', title: 'Project saved' }); },
  });
  const deleteProject = useMutation({
    mutationFn: () => api.projects.remove(id),
    onSuccess: () => { toast({ variant: 'success', title: 'Project deleted' }); router.replace('/projects'); },
  });
  const createColumn = useMutation({
    mutationFn: (name: string) => api.columns.create(id, { name }),
    onSuccess: () => { refresh(); setAddingColumn(false); setColumnName(''); },
  });
  const deleteColumn = useMutation({
    mutationFn: (colId: string) => api.columns.remove(colId),
    onSuccess: () => refresh(),
  });
  const createTask = useMutation({
    mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
      api.tasks.create(columnId, { title }),
    onSuccess: () => refresh(),
  });
  const updateTask = useMutation({
    mutationFn: ({ taskId, patch }: { taskId: string; patch: UpdateTask }) =>
      api.tasks.update(taskId, patch),
    onSuccess: () => refresh(),
  });
  const moveTask = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: string }) =>
      api.tasks.update(taskId, { columnId }),
    onSuccess: () => refresh(),
  });
  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.tasks.remove(taskId),
    onSuccess: () => { refresh(); setOpenTask(null); },
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !project) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-text-muted">Couldn’t load this project. <Link href="/projects" className="text-brand-blue hover:underline">Back to projects</Link></p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/projects" className="text-xs text-text-muted hover:text-brand-blue">← Projects</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-text-strong">{project.name}</h1>
            <Badge variant="brand">{project.status}</Badge>
          </div>
          {project.clientName ? <p className="mt-1 text-sm text-text-muted">{project.clientName}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditingProject(true)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => setDeletingProject(true)}>Delete</Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {project.columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            users={users?.data ?? []}
            dragging={dragTaskId}
            onDragStart={setDragTaskId}
            onDragEnd={() => setDragTaskId(null)}
            onDropTask={(taskId) => { if (taskId) moveTask.mutate({ taskId, columnId: col.id }); setDragTaskId(null); }}
            onAddTask={(title) => createTask.mutate({ columnId: col.id, title })}
            onDeleteColumn={() => deleteColumn.mutate(col.id)}
            onOpenTask={setOpenTask}
          />
        ))}

        {/* Add column */}
        <div className="w-72 shrink-0">
          {addingColumn ? (
            <div className="rounded-token border border-border bg-card p-3">
              <Input autoFocus value={columnName} placeholder="Column name"
                onChange={(e) => setColumnName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && columnName.trim()) createColumn.mutate(columnName.trim()); if (e.key === 'Escape') setAddingColumn(false); }} />
              <div className="mt-2 flex gap-2">
                <Button size="sm" loading={createColumn.isPending} disabled={!columnName.trim()} onClick={() => createColumn.mutate(columnName.trim())}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingColumn(false); setColumnName(''); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingColumn(true)}
              className="w-full rounded-token border border-dashed border-border py-3 text-sm font-medium text-text-muted hover:border-brand-blue hover:text-brand-blue">
              + Add column
            </button>
          )}
        </div>
      </div>

      {/* Edit project */}
      <Dialog open={editingProject} onClose={() => setEditingProject(false)} title="Edit project" size="lg" closeOnOverlayClick={false}>
        <ProjectForm initial={project} pending={updateProject.isPending}
          onSubmit={(p) => updateProject.mutateAsync(p).then(() => undefined)}
          onCancel={() => setEditingProject(false)} />
      </Dialog>

      {/* Delete project */}
      <Dialog open={deletingProject} onClose={() => setDeletingProject(false)} title="Delete project?"
        description={`“${project.name}” and its whole board will be permanently removed.`} size="sm" closeOnOverlayClick={false}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingProject(false)} disabled={deleteProject.isPending}>Cancel</Button>
            <Button variant="danger" loading={deleteProject.isPending} onClick={() => deleteProject.mutate()}>Delete</Button>
          </>
        } />

      {/* Task editor */}
      {openTask ? (
        <TaskDialog
          key={openTask.id}
          task={openTask}
          users={users?.data ?? []}
          pending={updateTask.isPending || deleteTask.isPending}
          onSave={(patch) => updateTask.mutateAsync({ taskId: openTask.id, patch }).then(() => setOpenTask(null))}
          onDelete={() => deleteTask.mutate(openTask.id)}
          onClose={() => setOpenTask(null)}
        />
      ) : null}
    </div>
  );
}

/* ---- Column ---- */

interface ColumnProps {
  column: BoardColumn;
  users: { id: string; name: string }[];
  dragging: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropTask: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onDeleteColumn: () => void;
  onOpenTask: (t: BoardTask) => void;
}

function Column({ column, dragging, onDragStart, onDragEnd, onDropTask, onAddTask, onDeleteColumn, onOpenTask }: ColumnProps) {
  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [over, setOver] = React.useState(false);

  function add() {
    if (title.trim()) { onAddTask(title.trim()); setTitle(''); setAdding(false); }
  }

  return (
    <div
      className={cn('flex w-72 shrink-0 flex-col rounded-token border bg-bg-tint', over ? 'border-brand-blue' : 'border-border')}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDropTask(e.dataTransfer.getData('taskId')); }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-strong">{column.name}</span>
          <span className="rounded-full bg-bg-tint-2 px-1.5 text-xs text-text-muted">{column.tasks.length}</span>
        </div>
        <button aria-label={`Delete ${column.name} column`} onClick={onDeleteColumn}
          className="text-text-muted hover:text-danger">
          <svg viewBox="0 0 20 20" fill="none" className="size-4"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="flex-1 space-y-2 px-2 pb-2">
        {column.tasks.map((task) => (
          <button
            key={task.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); onDragStart(task.id); }}
            onDragEnd={onDragEnd}
            onClick={() => onOpenTask(task)}
            className={cn(
              'block w-full cursor-grab rounded-token border border-border bg-card p-2.5 text-left shadow-card transition hover:border-brand-blue active:cursor-grabbing',
              dragging === task.id && 'opacity-50',
            )}
          >
            <p className={cn('text-sm font-medium text-text-strong', task.isCompleted && 'text-text-muted line-through')}>
              {task.title}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
              {task.assigneeName ? (
                <span className="grid size-6 place-items-center rounded-full bg-brand-blue text-[10px] font-semibold text-white" title={task.assigneeName}>
                  {initials(task.assigneeName)}
                </span>
              ) : null}
            </div>
          </button>
        ))}

        {adding ? (
          <div className="rounded-token border border-border bg-card p-2">
            <Textarea autoFocus rows={2} value={title} placeholder="Task title"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } if (e.key === 'Escape') setAdding(false); }} />
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled={!title.trim()} onClick={add}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setTitle(''); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full rounded-token px-2 py-1.5 text-left text-sm text-text-muted hover:bg-bg-tint-2 hover:text-brand-blue">
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Task dialog ---- */

interface TaskDialogProps {
  task: BoardTask;
  users: { id: string; name: string }[];
  pending: boolean;
  onSave: (patch: UpdateTask) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

function TaskDialog({ task, users, pending, onSave, onDelete, onClose }: TaskDialogProps) {
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? '');
  const [priority, setPriority] = React.useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = React.useState(task.assigneeId ?? '');
  const [dueDate, setDueDate] = React.useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [completed, setCompleted] = React.useState(task.isCompleted);

  function save() {
    void onSave({
      title: title.trim(),
      description: description.trim() === '' ? null : description.trim(),
      priority,
      assigneeId: assigneeId === '' ? null : assigneeId,
      dueDate: dueDate === '' ? null : new Date(dueDate).toISOString(),
      isCompleted: completed,
    });
  }

  return (
    <Dialog open onClose={onClose} title="Task" size="lg" closeOnOverlayClick={false}>
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} placeholder="Unassigned">
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 rounded-token border border-border bg-bg-tint px-3.5 py-3">
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="size-4 accent-brand-blue" />
          <span className="text-sm font-semibold text-text-strong">Completed</span>
        </label>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={onDelete} disabled={pending}>
            Delete task
          </Button>
          <div className="flex items-center gap-2">
            {pending ? <Spinner className="size-4 text-brand-blue" /> : null}
            <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
            <Button onClick={save} loading={pending} disabled={!title.trim()}>Save</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
