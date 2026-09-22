'use client';

import { Check, Pencil, Trash2 } from 'lucide-react';
import { UserAvatar } from '@/components/dashboard/user-avatar';
import { useData } from '@/lib/data-provider';
import {
  priorityConfig,
  formatDate,
  isOverdue,
  statusConfig,
} from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';

interface TaskRowProps {
  task: Task;
  showProject?: boolean;
  showAssignee?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskRow({
  task,
  showProject = true,
  showAssignee = true,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const { toggleTaskComplete, getUser, getProject } = useData();
  const assignee = getUser(task.assigneeId);
  const project = getProject(task.projectId);
  const priority = priorityConfig[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const isDone = task.status === 'done';

  const handleToggle = () => {
    toggleTaskComplete(task.id);
    if (!isDone) {
      toast.success('Task marked complete', {
        description: task.title,
      });
    } else {
      toast.info('Task reopened', {
        description: task.title,
      });
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-accent-cyan">
      <button
        onClick={handleToggle}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all focus-ring active:scale-90',
          isDone
            ? 'border-success bg-success text-white'
            : 'border-muted hover:border-accent-cyan'
        )}
        aria-label={isDone ? 'Mark task as incomplete' : 'Mark task as complete'}
      >
        {isDone && <Check className="h-3 w-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              priority.dot
            )}
            title={`${priority.label} priority`}
          />
          <p
            className={cn(
              'text-sm font-medium truncate',
              isDone ? 'text-muted-fg line-through' : 'text-foreground'
            )}
          >
            {task.title}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-fg">
          {showProject && project && (
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-medium">
              {project.name}
            </span>
          )}
          <span className={statusConfig[task.status].color}>
            {statusConfig[task.status].label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            'text-xs font-medium',
            overdue ? 'text-danger' : 'text-muted-fg'
          )}
        >
          {formatDate(task.dueDate)}
        </span>
        {showAssignee && assignee && <UserAvatar user={assignee} size="sm" />}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && <button type="button" onClick={() => onEdit(task)} className="rounded p-1.5 text-muted-fg hover:bg-surface-muted hover:text-foreground focus-ring" aria-label={`Edit ${task.title}`}><Pencil className="h-3.5 w-3.5" /></button>}
            {onDelete && <button type="button" onClick={() => onDelete(task)} className="rounded p-1.5 text-muted-fg hover:bg-danger/10 hover:text-danger focus-ring" aria-label={`Delete ${task.title}`}><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>
        )}
      </div>
    </div>
  );
}
