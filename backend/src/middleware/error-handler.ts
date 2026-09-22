import type { ErrorRequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { describePrismaError } from '../utils/prisma-error';

// Every error response has the shape { error: { code, message, details? } }.
function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): void {
  res.status(status).json({ error: { code, message, details } });
}

// Client errors raised by Express/body-parser itself (bad JSON, body too large...).
function describeHttpError(status: number, type: unknown): { code: string; message: string } {
  if (type === 'entity.parse.failed') return { code: 'BAD_REQUEST', message: 'Malformed JSON body' };
  if (status === 413) return { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  if (status === 415) {
    return { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported content type or encoding' };
  }
  return { code: 'BAD_REQUEST', message: 'Bad request' };
}

// The 4-argument signature is required for Express to treat this as an error handler.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Too late to send a JSON error; let Express close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    );
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  const prismaError = describePrismaError(err, { exposeDetails: !env.isProduction });
  if (prismaError) {
    // The raw Prisma message stays in the server log; the client gets a safe one.
    if (prismaError.status >= 500) console.error(err);
    sendError(res, prismaError.status, prismaError.code, prismaError.message, prismaError.details);
    return;
  }

  const status = typeof err?.status === 'number' ? err.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) {
    const { code, message } = describeHttpError(status, err.type);
    sendError(res, status, code, message);
    return;
  }

  console.error(err);
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    env.isProduction || !(err instanceof Error) ? 'Internal server error' : err.message
  );
};
