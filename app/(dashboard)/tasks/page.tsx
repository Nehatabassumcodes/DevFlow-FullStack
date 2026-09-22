'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, CheckSquare, X, Filter, Columns3, Plus, Sparkles } from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { TaskRow } from '@/components/dashboard/task-row';
import { matchesSearch } from '@/lib/helpers';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { TaskRowSkeleton } from '@/components/states/skeletons';
import { TaskFormDialog } from '@/components/tasks/task-form-dialog';
import { AiTaskGeneratorDialog } from '@/components/tasks/ai-task-generator-dialog';
import type { Task } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TasksPage() {
  const { users, tasks, projects, loading, error, retry, getUser, getProject, deleteTask } =
    useData();
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | undefined>();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [projectFilter, setProjectFilter] = React.useState('all');
  const [assigneeFilter, setAssigneeFilter] = React.useState('all');

  const filtered = React.useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearchTerm = matchesSearch(
        [
          t.title,
          t.description,
          getProject(t.projectId)?.name,
          getUser(t.assigneeId)?.name,
        ],
        search
      );
      const matchesStatus =
        statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesProject =
        projectFilter === 'all' || t.projectId === projectFilter;
      const matchesAssignee =
        assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
      return (
        matchesSearchTerm &&
        matchesStatus &&
        matchesPriority &&
        matchesProject &&
        matchesAssignee
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
    assigneeFilter,
    getProject,
    getUser,
  ]);

  const hasFilters =
    search ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    assigneeFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setAssigneeFilter('all');
  };

  const openCreate = () => { setEditingTask(undefined); setTaskDialogOpen(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setTaskDialogOpen(true); };
  const removeTask = (task: Task) => { if (window.confirm(`Delete "${task.title}"?`)) deleteTask(task.id); };

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            {loading ? 'Loading...' : `${filtered.length} of ${tasks.length} tasks`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Task</Button>
          <Button
            variant="outline"
            onClick={() => setAiDialogOpen(true)}
            disabled={projects.length === 0}
            title={projects.length === 0 ? 'Create a project first' : undefined}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Link href="/kanban" className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-accent-cyan"><Columns3 className="h-4 w-4" /><span className="hidden sm:inline">View as Board</span></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            placeholder="Search tasks, projects, assignees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]" aria-label="Filter by project">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by assignee">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users
                .map((user) => user.id)
                .map((id) => {
                  const user = getUser(id);
                  return user ? (
                    <SelectItem key={id} value={id}>
                      {user.name}
                    </SelectItem>
                  ) : null;
                })}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} className="shrink-0">
              <X className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No tasks found"
          description={
            hasFilters
              ? 'No tasks match your current filters. Try adjusting your search.'
              : 'You don\'t have any tasks yet.'
          }
          action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              showProject
              showAssignee
              onEdit={openEdit}
              onDelete={removeTask}
            />
          ))}
        </div>
      )}
      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} task={editingTask} />
      <AiTaskGeneratorDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        defaultProjectId={projectFilter}
      />
    </div>
  );
}
