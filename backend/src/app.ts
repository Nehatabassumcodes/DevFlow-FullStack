import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: env.frontendOrigins, // from FRONTEND_ORIGIN
      credentials: true,
      exposedHeaders: ['Location'], // lets the browser read the Location header on 201 responses
      maxAge: 600, // cache preflight responses for 10 minutes
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
