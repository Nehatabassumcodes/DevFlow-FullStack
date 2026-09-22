import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { validate } from '../middleware/validate';
import { rateLimitPerUser } from '../middleware/rate-limit';
import { asyncHandler } from '../utils/async-handler';
import { generateTasksSchema } from '../schemas/ai.schema';

export const aiRouter = Router();

// Each call costs money, so it is limited per signed-in user (10 per minute).
aiRouter.post(
  '/generate-tasks',
  rateLimitPerUser({
    windowMs: 60_000,
    max: 10,
    message: 'You are generating tasks too quickly. Please wait a minute and try again.',
  }),
  validate({ body: generateTasksSchema }),
  asyncHandler(aiController.generateTasks)
);
