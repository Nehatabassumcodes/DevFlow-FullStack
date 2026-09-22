'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { KanbanCard } from '@/components/dashboard/kanban-card';
import { ErrorState } from '@/components/states/error-state';
import { KanbanColumnSkeleton } from '@/components/states/skeletons';
import { statusConfig, statusOrder } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Task, TaskStatus } from '@/lib/types';

const columnMeta: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'text-muted-fg' },
  todo: { label: 'To Do', color: 'text-accent-blue' },
  'in-progress': { label: 'In Progress', color: 'text-accent-violet' },
  'in-review': { label: 'In Review', color: 'text-warning' },
  done: { label: 'Done', color: 'text-success' },
};

export default function KanbanPage() {
  const { tasks, projects, updateTaskStatus, addTask, loading, error, retry } =
    useData();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [quickAddColumn, setQuickAddColumn] = React.useState<TaskStatus | null>(
    null
  );
  const [quickAddValue, setQuickAddValue] = React.useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetStatus = statusOrder.find((s) => s === overId);
    if (!targetStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    updateTaskStatus(taskId, targetStatus);
    toast.success('Task moved', {
      description: `"${task.title}" moved to ${columnMeta[targetStatus].label}`,
    });
  };

  const handleQuickAdd = (status: TaskStatus) => {
    if (!quickAddValue.trim()) {
      setQuickAddColumn(null);
      return;
    }
    const firstProject = projects[0];
    if (!firstProject) {
      toast.error('Create a project first', { description: 'Tasks must belong to a project.' });
      setQuickAddColumn(null);
      return;
    }
    addTask({
      title: quickAddValue.trim(),
      status,
      priority: 'medium',
      projectId: firstProject.id,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    toast.success('Task created', {
      description: quickAddValue.trim(),
    });
    setQuickAddValue('');
    setQuickAddColumn(null);
  };

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-muted-fg">Loading...</p>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {statusOrder.map((status) => (
            <div key={status} className="flex-1 min-w-[250px]">
              <KanbanColumnSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          Kanban Board
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          Drag cards between columns or use the menu to move tasks
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusOrder.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            const meta = columnMeta[status];

            return (
              <KanbanColumn
                key={status}
                status={status}
                label={meta.label}
                color={meta.color}
                tasks={columnTasks}
                isQuickAddOpen={quickAddColumn === status}
                quickAddValue={quickAddValue}
                onQuickAddValueChange={setQuickAddValue}
                onQuickAddOpen={() => {
                  setQuickAddColumn(status);
                  setQuickAddValue('');
                }}
                onQuickAddSubmit={() => handleQuickAdd(status)}
                onQuickAddCancel={() => setQuickAddColumn(null)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-1 opacity-90">
              <KanbanCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  isQuickAddOpen: boolean;
  quickAddValue: string;
  onQuickAddValueChange: (v: string) => void;
  onQuickAddOpen: () => void;
  onQuickAddSubmit: () => void;
  onQuickAddCancel: () => void;
}

function KanbanColumn({
  status,
  label,
  color,
  tasks,
  isQuickAddOpen,
  quickAddValue,
  onQuickAddValueChange,
  onQuickAddOpen,
  onQuickAddSubmit,
  onQuickAddCancel,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-[250px] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', color)}>{label}</span>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-muted px-1.5 text-xs font-medium text-muted-fg">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-3 rounded-xl border-2 border-dashed border-transparent p-2 transition-colors',
          isOver && 'border-accent-cyan bg-accent-cyan/5'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isQuickAddOpen && (
          <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-fg">
            No tasks
          </div>
        )}

        {/* Quick add */}
        {isQuickAddOpen ? (
          <div className="rounded-lg border bg-card p-2 shadow-sm">
            <input
              autoFocus
              type="text"
              value={quickAddValue}
              onChange={(e) => onQuickAddValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onQuickAddSubmit();
                if (e.key === 'Escape') onQuickAddCancel();
              }}
              onBlur={() => onQuickAddSubmit()}
              placeholder="Task title..."
              className="w-full rounded border bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ) : (
          <button
            onClick={onQuickAddOpen}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed py-2.5 text-sm text-muted-fg transition-colors hover:border-accent-cyan hover:text-accent-cyan"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
