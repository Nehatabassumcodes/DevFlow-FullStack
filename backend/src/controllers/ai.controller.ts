import type { Request, Response } from 'express';
import * as aiService from '../services/ai.service';
import type { GenerateTasksInput } from '../schemas/ai.schema';

// POST /api/ai/generate-tasks -> { data: { tasks: [{ title, description, priority }] } }
// Suggestions only: nothing is saved until the client posts the accepted tasks to /api/tasks.
export async function generateTasks(req: Request, res: Response): Promise<void> {
  const tasks = await aiService.generateTaskSuggestions(req.body as GenerateTasksInput);
  res.status(200).json({ data: { tasks } });
}
