import { env } from './config/env';
import { createApp } from './app';
import { disconnectPrisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`DevFlow API running on http://localhost:${env.port}/api (${env.nodeEnv})`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Change PORT in backend/.env.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  // Force exit if open connections keep the server from closing.
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
  // Keep-alive connections would otherwise hold the server open until the timeout above.
  server.closeIdleConnections();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
