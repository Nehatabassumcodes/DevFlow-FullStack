import type { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema';

// Success responses are always { data } (lists also include meta.total).
// Request bodies/params are already validated by the validate() middleware.

export async function listProjects(_req: Request, res: Response): Promise<void> {
  const projects = await projectService.listProjects();
  res.status(200).json({ data: projects, meta: { total: projects.length } });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await projectService.getProjectById(req.params.id);
  res.status(200).json({ data: project });
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const project = await projectService.createProject(req.body as CreateProjectInput);
  res.status(201).location(`/api/projects/${project.id}`).json({ data: project });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const project = await projectService.updateProject(req.params.id, req.body as UpdateProjectInput);
  res.status(200).json({ data: project });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const project = await projectService.deleteProject(req.params.id);
  res.status(200).json({ data: project });
}
