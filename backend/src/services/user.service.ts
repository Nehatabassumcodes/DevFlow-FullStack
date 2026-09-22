import { getPrisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import type { CreateUserInput, UpdateUserInput } from '../schemas/user.schema';

// Duplicate emails surface as Prisma error P2002, which the central error
// handler turns into a 409 response.

export function listUsers() {
  return getPrisma().user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } });
}

export async function getUserById(id: string) {
  const user = await getPrisma().user.findUnique({ where: { id }, select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } });
  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return user;
}

export function createUser(data: CreateUserInput) {
  return getPrisma().user.create({ data, select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } });
}

export async function updateUser(id: string, data: UpdateUserInput) {
  await getUserById(id);
  return getPrisma().user.update({ where: { id }, data, select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } });
}

export async function deleteUser(id: string) {
  await getUserById(id);
  return getPrisma().user.delete({ where: { id }, select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } });
}
