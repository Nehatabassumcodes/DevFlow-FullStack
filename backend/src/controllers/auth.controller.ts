import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { AppError } from '../utils/app-error';
import { getRequestUserId } from '../middleware/auth';

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.registerUser((req.body as RegisterInput).name, (req.body as RegisterInput).email, (req.body as RegisterInput).password);
  res.status(201).setHeader('Set-Cookie', authService.setSessionCookie(authService.createSession(user.id))).json({ data: user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const user = await authService.authenticateUser(input.email, input.password);
  res.status(200).setHeader('Set-Cookie', authService.setSessionCookie(authService.createSession(user.id))).json({ data: user });
}

export function logout(_req: Request, res: Response): void {
  res.status(204).setHeader('Set-Cookie', authService.sessionCookieOptions()).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  const user = await authService.getAuthenticatedUser(userId);
  if (!user) throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  res.status(200).json({ data: user });
}
