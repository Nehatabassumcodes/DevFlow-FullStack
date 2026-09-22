'use client';

import Link from 'next/link';
import { Calendar, Building2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AvatarGroup } from '@/components/dashboard/user-avatar';
import { ProjectCardActions } from '@/components/projects/project-card-actions';
import { useData } from '@/lib/data-provider';
import { healthConfig, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { getProjectProgress, getUser, getTasksByProject, getClient } = useData();
  const progress = getProjectProgress(project.id);
  const members = project.memberIds
    .map((id) => getUser(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getUser>>[];
  const taskCount = getTasksByProject(project.id).length;
  const health = healthConfig[project.health];
  const client = project.clientId ? getClient(project.clientId) : undefined;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent-cyan focus-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-accent-cyan transition-colors">
          {project.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              health.bg,
              health.color
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', health.dot)} />
            {health.label}
          </span>
          {onEdit && onDelete && (
            <ProjectCardActions project={project} onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-fg">
        {project.description}
      </p>
      {client && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-fg">
          <Building2 className="h-3 w-3" />
          {client.name} · {client.company}
        </p>
      )}

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-fg">Progress</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <Progress
          value={progress}
          className="h-1.5"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <AvatarGroup users={members} max={3} size="sm" />
        <div className="flex items-center gap-3 text-xs text-muted-fg">
          <span>{taskCount} tasks</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(project.dueDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
