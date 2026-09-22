import type { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../schemas/task.schema';

// Success responses are always { data } (lists also include meta.total).
// Request bodies/params/query are already validated by the validate() middleware.

export async function listTasks(req: Request, res: Response): Promise<void> {
  const tasks = await taskService.listTasks(req.query as ListTasksQuery);
  res.status(200).json({ data: tasks, meta: { total: tasks.length } });
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTaskById(req.params.id);
  res.status(200).json({ data: task });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.createTask(req.body as CreateTaskInput);
  res.status(201).location(`/api/tasks/${task.id}`).json({ data: task });
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.updateTask(req.params.id, req.body as UpdateTaskInput);
  res.status(200).json({ data: task });
}

export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const task = await taskService.updateTaskStatus(req.params.id, req.body as UpdateTaskStatusInput);
  res.status(200).json({ data: task });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.deleteTask(req.params.id);
  res.status(200).json({ data: task });
}
