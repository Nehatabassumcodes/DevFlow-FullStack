import { Router } from 'express';
import { healthRouter } from './health.routes';
import { userRouter } from './user.routes';
import { projectRouter } from './project.routes';
import { taskRouter } from './task.routes';
import { authRouter } from './auth.routes';
import { aiRouter } from './ai.routes';
import { requireAuth } from '../middleware/auth';

// Mounted at /api. Resource routers are added here.
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', requireAuth, userRouter);
apiRouter.use('/projects', requireAuth, projectRouter);
apiRouter.use('/tasks', requireAuth, taskRouter);
apiRouter.use('/ai', requireAuth, aiRouter);
