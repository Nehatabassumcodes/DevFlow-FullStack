import type { Request, Response } from 'express';
import * as userService from '../services/user.service';
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';

// Success responses are always { data } (lists also include meta.total).
// Request bodies/params are already validated by the validate() middleware.

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsers();
  res.status(200).json({ data: users, meta: { total: users.length } });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ data: user });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const user = await userService.createUser(req.body as CreateUserInput);
  res.status(201).location(`/api/users/${user.id}`).json({ data: user });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const user = await userService.updateUser(req.params.id, req.body as UpdateUserInput);
  res.status(200).json({ data: user });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const user = await userService.deleteUser(req.params.id);
  res.status(200).json({ data: user });
}
