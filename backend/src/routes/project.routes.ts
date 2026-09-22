import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/async-handler';
import {
  createProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from '../schemas/project.schema';

export const projectRouter = Router();

projectRouter.post(
  '/',
  validate({ body: createProjectSchema }),
  asyncHandler(projectController.createProject)
);
projectRouter.get('/', asyncHandler(projectController.listProjects));
projectRouter.get(
  '/:id',
  validate({ params: projectIdParamSchema }),
  asyncHandler(projectController.getProject)
);
projectRouter.patch(
  '/:id',
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  asyncHandler(projectController.updateProject)
);
projectRouter.delete(
  '/:id',
  validate({ params: projectIdParamSchema }),
  asyncHandler(projectController.deleteProject)
);
