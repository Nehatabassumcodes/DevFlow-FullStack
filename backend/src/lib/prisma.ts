import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

// Created on first use so the server can boot even before `prisma generate`
// has been run. Import getPrisma() wherever database access is needed.
let client: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!client) {
    client = new PrismaClient({
      log: env.isProduction ? ['error'] : ['warn', 'error'],
    });
  }
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
}
