import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/async-handler';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '../schemas/user.schema';

export const userRouter = Router();

userRouter.post('/', validate({ body: createUserSchema }), asyncHandler(userController.createUser));
userRouter.get('/', asyncHandler(userController.listUsers));
userRouter.get('/:id', validate({ params: userIdParamSchema }), asyncHandler(userController.getUser));
userRouter.patch(
  '/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  asyncHandler(userController.updateUser)
);
userRouter.delete('/:id', validate({ params: userIdParamSchema }), asyncHandler(userController.deleteUser));
