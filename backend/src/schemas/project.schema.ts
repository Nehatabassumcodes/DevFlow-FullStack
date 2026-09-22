import { z } from 'zod';
import { dateSchema, descriptionSchema, uuidSchema } from './common.schema';

const nameSchema = z
  .string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' })
  .trim()
  .min(1, 'Name is required')
  .max(120, 'Name must be at most 120 characters');

// Unknown fields (id, createdAt, ...) are rejected instead of silently ignored.
// description, ownerId and dueDate may be null (or omitted) to mean "not set".
export const createProjectSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema().nullish(),
    ownerId: uuidSchema('owner id').nullish(),
    dueDate: dateSchema('Due date').nullish(),
  })
  .strict();

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update (name, description, ownerId or dueDate)',
  });

export const projectIdParamSchema = z.object({
  id: uuidSchema('project id'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
