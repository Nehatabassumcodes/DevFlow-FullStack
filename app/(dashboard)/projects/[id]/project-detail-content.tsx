'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, CheckSquare, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '@/lib/data-provider';
import { TaskRow } from '@/components/dashboard/task-row';
import { AvatarGroup } from '@/components/dashboard/user-avatar';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState } from '@/components/states/error-state';
import { EmptyState } from '@/components/states/empty-state';
import {
  TaskRowSkeleton,
  ProjectCardSkeleton,
} from '@/components/states/skeletons';
import { healthConfig, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const {
    getProject,
    getTasksByProject,
    getProjectProgress,
    getUser,
    getClient,
    clients,
    updateProject,
    loading,
    error,
    retry,
  } = useData();

  const projectId = params.id as string;
  const project = getProject(projectId);
  const tasks = getTasksByProject(projectId);
  const progress = getProjectProgress(projectId);

  if (loading) {
    return (
      <div className="space-y-6">
        <ProjectCardSkeleton />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (!project) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-8 w-8" />}
        title="Project not found"
        description="The project you're looking for doesn't exist or has been removed."
        action={{ label: 'Back to projects', onClick: () => router.push('/projects') }}
      />
    );
  }

  const members = project.memberIds
    .map((id) => getUser(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getUser>>[];
  const health = healthConfig[project.health];
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const client = project.clientId ? getClient(project.clientId) : undefined;

  const handleClientChange = (value: string) => {
    const clientId = value === 'unassigned' ? undefined : value;
    updateProject(project.id, { clientId });
    const newClient = clientId ? getClient(clientId) : undefined;
    toast.success(
      newClient ? 'Client updated' : 'Client removed',
      {
        description: newClient
          ? `${project.name} is now linked to ${newClient.name}.`
          : `${project.name} is now unassigned.`,
      }
    );
  };

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-fg hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {project.name}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  health.bg,
                  health.color
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', health.dot)} />
                {health.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-fg">{project.description}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-fg">Progress</p>
            <p className="mt-1 font-heading text-xl font-bold text-foreground">
              {progress}%
            </p>
            <Progress value={progress} className="mt-2 h-1.5" />
          </div>
          <div>
            <p className="text-xs text-muted-fg">Tasks</p>
            <p className="mt-1 font-heading text-xl font-bold text-foreground">
              {completedTasks}/{tasks.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-fg flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Due Date
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-foreground">
              {formatDate(project.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-fg flex items-center gap-1">
              <Users className="h-3 w-3" /> Members
            </p>
            <div className="mt-2">
              <AvatarGroup users={members} max={4} size="sm" />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <p className="text-xs text-muted-fg flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Client
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Select
              value={project.clientId || 'unassigned'}
              onValueChange={handleClientChange}
            >
              <SelectTrigger className="w-full sm:w-[260px]" aria-label="Client">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {client && (
              <Link
                href="/clients"
                className="text-sm font-medium text-accent-cyan hover:underline"
              >
                View clients
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          Tasks
        </h2>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="No tasks yet"
            description="This project doesn't have any tasks assigned to it yet."
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showProject={false}
                showAssignee
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
