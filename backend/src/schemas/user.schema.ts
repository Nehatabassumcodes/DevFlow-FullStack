import { z } from 'zod';

// Emails are trimmed and lower-cased so "A@x.io" and "a@x.io" count as duplicates.
const nameSchema = z
  .string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' })
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

const emailSchema = z
  .string({ required_error: 'Email is required', invalid_type_error: 'Email must be a string' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .email('Invalid email address');

// Unknown fields (id, createdAt, ...) are rejected instead of silently ignored.
export const createUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
  })
  .strict();

export const updateUserSchema = createUserSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update (name or email)',
  });

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
