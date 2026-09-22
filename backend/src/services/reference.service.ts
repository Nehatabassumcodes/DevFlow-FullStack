import { getPrisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';

// A body that points at a project/user that does not exist is a client error on
// the request itself, so it is reported as a 400 in the same shape as Zod
// validation errors (details[].path names the offending field).
function invalidReference(path: string, message: string): AppError {
  return new AppError(400, 'Request validation failed', 'VALIDATION_ERROR', [{ path, message }]);
}

export async function ensureProjectReference(projectId: string): Promise<void> {
  const project = await getPrisma().project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) throw invalidReference('projectId', 'Project not found');
}

export async function ensureUserReference(userId: string, path: 'ownerId' | 'assigneeId'): Promise<void> {
  const user = await getPrisma().user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw invalidReference(path, 'User not found');
}
