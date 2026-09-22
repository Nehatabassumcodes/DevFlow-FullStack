import { z } from 'zod';
import { uuidSchema } from './common.schema';

export const AI_DESCRIPTION_MIN = 10;
export const AI_DESCRIPTION_MAX = 4000;

// The description is what the AI works from; the project decides where the
// (reviewed) tasks will be saved and gives the AI its context.
export const generateTasksSchema = z
  .object({
    projectId: uuidSchema('project id'),
    description: z
      .string({
        required_error: 'Description is required',
        invalid_type_error: 'Description must be a string',
      })
      .trim()
      .min(AI_DESCRIPTION_MIN, `Describe the feature in at least ${AI_DESCRIPTION_MIN} characters`)
      .max(AI_DESCRIPTION_MAX, `Description must be at most ${AI_DESCRIPTION_MAX} characters`),
  })
  .strict();

export type GenerateTasksInput = z.infer<typeof generateTasksSchema>;
