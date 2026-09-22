'use client';

import { MoreHorizontal, Calendar } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserAvatar } from '@/components/dashboard/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useData } from '@/lib/data-provider';
import {
  priorityConfig,
  formatDate,
  isOverdue,
  statusOrder,
  statusConfig,
} from '@/lib/helpers';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { getUser, getProject, updateTaskStatus } = useData();
  const assignee = getUser(task.assigneeId);
  const project = getProject(task.projectId);
  const priority = priorityConfig[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleMove = (status: TaskStatus) => {
    updateTaskStatus(task.id, status);
  };

  const otherStatuses = statusOrder.filter((s) => s !== task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all',
        'hover:shadow-md hover:border-accent-cyan',
        isDragging &&
          'shadow-lg opacity-90 rotate-1 cursor-grabbing'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn('h-2 w-2 shrink-0 rounded-full', priority.dot)}
            title={`${priority.label} priority`}
          />
          <p className="text-sm font-medium text-foreground truncate">
            {task.title}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded p-1 text-muted-fg opacity-0 transition-opacity hover:bg-surface-muted hover:text-foreground group-hover:opacity-100 focus-ring focus:opacity-100"
              aria-label="Move task"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-fg">
              Move to...
            </div>
            {otherStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleMove(status)}
              >
                <span className={statusConfig[status].color}>
                  {statusConfig[status].label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {project && (
        <span className="mt-2 inline-block rounded bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-muted-fg">
          {project.name}
        </span>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            overdue ? 'text-danger' : 'text-muted-fg'
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDate(task.dueDate)}
        </span>
        {assignee && <UserAvatar user={assignee} size="sm" />}
      </div>
    </div>
  );
}
