import type { Prisma } from '@prisma/client';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema';
import { ensureUserReference } from './reference.service';

const ownerSelect = { id: true, name: true, email: true } as const;

// Lists and single projects include the owner and a task count.
const projectInclude = {
  owner: { select: ownerSelect },
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

type ProjectWithRelations = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

// Flattens Prisma's `_count: { tasks }` into `taskCount`.
function toProjectResponse<T extends ProjectWithRelations>({ _count, ...project }: T) {
  return { ...project, taskCount: _count.tasks };
}

export async function listProjects() {
  const projects = await getPrisma().project.findMany({
    include: projectInclude,
    orderBy: { createdAt: 'desc' },
  });
  return projects.map(toProjectResponse);
}

// Plain lookup (no relations) used to check a project exists.
async function findProjectOrThrow(id: string) {
  const project = await getPrisma().project.findUnique({ where: { id }, select: { id: true } });
  if (!project) {
    throw new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND');
  }
}

// The single-project view also lists the project's tasks (newest first).
export async function getProjectById(id: string) {
  const project = await getPrisma().project.findUnique({
    where: { id },
    include: {
      ...projectInclude,
      tasks: {
        orderBy: { createdAt: 'desc' },
        include: { assignee: { select: ownerSelect } },
      },
    },
  });
  if (!project) {
    throw new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND');
  }
  return toProjectResponse(project);
}

export async function createProject(data: CreateProjectInput) {
  if (data.ownerId) await ensureUserReference(data.ownerId, 'ownerId');
  const project = await getPrisma().project.create({ data, include: projectInclude });
  return toProjectResponse(project);
}

export async function updateProject(id: string, data: UpdateProjectInput) {
  await findProjectOrThrow(id);
  if (data.ownerId) await ensureUserReference(data.ownerId, 'ownerId');
  const project = await getPrisma().project.update({
    where: { id },
    data,
    include: projectInclude,
  });
  return toProjectResponse(project);
}

// Deleting a project also deletes its tasks (onDelete: Cascade in the schema).
export async function deleteProject(id: string) {
  await findProjectOrThrow(id);
  const project = await getPrisma().project.delete({ where: { id }, include: projectInclude });
  return toProjectResponse(project);
}
