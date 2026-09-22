import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import { decodeSession, getSessionCookieName } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    return index === -1 ? [part.trim(), ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = parseCookies(req.headers.cookie)[getSessionCookieName()];
  const session = decodeSession(token);
  if (!session) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }
  req.userId = session.userId;
  next();
}

export function getRequestUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).userId;
}
