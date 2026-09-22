import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/async-handler';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/task.schema';

export const taskRouter = Router();

taskRouter.post('/', validate({ body: createTaskSchema }), asyncHandler(taskController.createTask));
taskRouter.get('/', validate({ query: listTasksQuerySchema }), asyncHandler(taskController.listTasks));
taskRouter.get('/:id', validate({ params: taskIdParamSchema }), asyncHandler(taskController.getTask));
taskRouter.patch(
  '/:id/status',
  validate({ params: taskIdParamSchema, body: updateTaskStatusSchema }),
  asyncHandler(taskController.updateTaskStatus)
);
taskRouter.patch(
  '/:id',
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  asyncHandler(taskController.updateTask)
);
taskRouter.delete('/:id', validate({ params: taskIdParamSchema }), asyncHandler(taskController.deleteTask));
