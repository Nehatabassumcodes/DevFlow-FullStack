import type { Prisma } from '@prisma/client';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../schemas/task.schema';
import { ensureProjectReference, ensureUserReference } from './reference.service';

// Every task response includes its project and assignee (null when unassigned).
const taskInclude = {
  project: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TaskInclude;

export function listTasks(filters: ListTasksQuery) {
  return getPrisma().task.findMany({
    where: filters,
    include: taskInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTaskById(id: string) {
  const task = await getPrisma().task.findUnique({ where: { id }, include: taskInclude });
  if (!task) {
    throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
  }
  return task;
}

async function assertTaskExists(id: string) {
  const task = await getPrisma().task.findUnique({ where: { id }, select: { id: true } });
  if (!task) {
    throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
  }
}

export async function createTask(data: CreateTaskInput) {
  await ensureProjectReference(data.projectId);
  if (data.assigneeId) await ensureUserReference(data.assigneeId, 'assigneeId');
  return getPrisma().task.create({ data, include: taskInclude });
}

export async function updateTask(id: string, data: UpdateTaskInput) {
  await assertTaskExists(id);
  if (data.projectId) await ensureProjectReference(data.projectId);
  if (data.assigneeId) await ensureUserReference(data.assigneeId, 'assigneeId');
  return getPrisma().task.update({ where: { id }, data, include: taskInclude });
}

export async function updateTaskStatus(id: string, { status }: UpdateTaskStatusInput) {
  await assertTaskExists(id);
  return getPrisma().task.update({ where: { id }, data: { status }, include: taskInclude });
}

export async function deleteTask(id: string) {
  await assertTaskExists(id);
  return getPrisma().task.delete({ where: { id }, include: taskInclude });
}
