import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/task';
import { dateSchema, descriptionSchema, uuidSchema } from './common.schema';

const statusSchema = z.enum(TASK_STATUSES, {
  errorMap: (_issue, ctx) => ({
    message:
      ctx.data === undefined
        ? 'Status is required'
        : `Status must be one of: ${TASK_STATUSES.join(', ')}`,
  }),
});

const prioritySchema = z.enum(TASK_PRIORITIES, {
  errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` }),
});

const titleSchema = z
  .string({ required_error: 'Title is required', invalid_type_error: 'Title must be a string' })
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be at most 200 characters');

// status defaults to TODO and priority to MEDIUM. description, assigneeId and
// dueDate may be null (or omitted) to mean "not set".
export const createTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema().nullish(),
    projectId: uuidSchema('project id'),
    assigneeId: uuidSchema('assignee id').nullish(),
    priority: prioritySchema.default('MEDIUM'),
    status: statusSchema.default('TODO'),
    dueDate: dateSchema('Due date').nullish(),
  })
  .strict();

// No defaults on update: only the fields that were sent are changed, and a task
// can be moved to another project by sending a new projectId.
export const updateTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema().nullish(),
    projectId: uuidSchema('project id'),
    assigneeId: uuidSchema('assignee id').nullish(),
    priority: prioritySchema,
    status: statusSchema,
    dueDate: dateSchema('Due date').nullish(),
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message:
      'Provide at least one field to update (title, description, projectId, assigneeId, priority, status or dueDate)',
  });

export const updateTaskStatusSchema = z.object({ status: statusSchema }).strict();

export const taskIdParamSchema = z.object({
  id: uuidSchema('task id'),
});

// Optional list filters, e.g. GET /api/tasks?projectId=...&status=DONE
export const listTasksQuerySchema = z.object({
  projectId: uuidSchema('project id').optional(),
  assigneeId: uuidSchema('assignee id').optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
