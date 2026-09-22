import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';

export const authRouter = Router();
authRouter.post('/register', validate({ body: registerSchema }), asyncHandler(authController.register));
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
