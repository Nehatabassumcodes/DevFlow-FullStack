'use client';

import Link from 'next/link';
import { Mail, Phone, Building2, Globe, Briefcase, Calendar, CheckSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ClientAvatar } from '@/components/clients/client-avatar';
import { ClientStatusBadge } from '@/components/clients/client-status-badge';
import { useData } from '@/lib/data-provider';
import { healthConfig, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import type { Client } from '@/lib/types';

interface ClientViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ClientViewDialog({ open, onOpenChange, client }: ClientViewDialogProps) {
  const { getProjectsByClient, getProjectProgress, getTasksByProject } = useData();

  if (!client) return null;

  const projects = getProjectsByClient(client.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">{client.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Client details for {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-4">
          <ClientAvatar id={client.id} name={client.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-foreground">
                {client.name}
              </h2>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-fg">{client.company}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-surface-muted/50 p-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 shrink-0 text-muted-fg" />
            <span className="truncate text-foreground">{client.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-muted-fg" />
            <span className="text-foreground">{client.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 shrink-0 text-muted-fg" />
            <span className="truncate text-foreground">{client.company}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 shrink-0 text-muted-fg" />
            <span className="text-foreground">{client.country || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm sm:col-span-2">
            <Briefcase className="h-4 w-4 shrink-0 text-muted-fg" />
            <span className="text-foreground">{client.industry}</span>
          </div>
        </div>

        {client.notes && (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-fg">
              Notes
            </h3>
            <p className="text-sm text-foreground">{client.notes}</p>
          </div>
        )}

        <div>
          <h3 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-fg">
            <span>Associated Projects</span>
            <span>{projects.length}</span>
          </h3>

          {projects.length === 0 ? (
            <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-fg">
              No projects linked to this client yet.
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => {
                const health = healthConfig[project.health];
                const progress = getProjectProgress(project.id);
                const taskCount = getTasksByProject(project.id).length;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    onClick={() => onOpenChange(false)}
                    className="block rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-accent-cyan"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {project.name}
                      </span>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          health.bg,
                          health.color
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', health.dot)} />
                        {health.label}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-fg">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {taskCount} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.dueDate)}
                      </span>
                      <span>{progress}% complete</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
