'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { useData } from '@/lib/data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];
const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
function dateInputValue(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const { users, projects, currentUser, addTask, updateTask } = useData();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [projectId, setProjectId] = React.useState('');
  const [assigneeId, setAssigneeId] = React.useState('');
  const [status, setStatus] = React.useState<TaskStatus>('todo');
  const [priority, setPriority] = React.useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setProjectId(task?.projectId ?? projects[0]?.id ?? '');
    setAssigneeId(task?.assigneeId || currentUser.id);
    setStatus(task?.status ?? 'todo');
    setPriority(task?.priority ?? 'medium');
    setDueDate(dateInputValue(task?.dueDate));
    setError('');
  }, [open, task, projects, currentUser.id]);

  const availableUsers = React.useMemo(() => {
    const unique = new Map(users.map((user) => [user.id, user]));
    if (!unique.has(currentUser.id)) unique.set(currentUser.id, currentUser);
    return Array.from(unique.values());
  }, [users, currentUser]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError('Task title is required.'); return; }
    if (!projectId) { setError('Select a project.'); return; }
    const payload = { title: title.trim(), description: description.trim() || undefined, projectId, assigneeId: assigneeId || undefined, status, priority, dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : '' };
    if (task) {
      updateTask(task.id, payload);
      toast.success('Task updated', { description: task.title });
    } else {
      addTask(payload);
      toast.success('Task created', { description: payload.title });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Create task'}</DialogTitle>
          <DialogDescription>{task ? 'Update task details and assignment.' : 'Add a task to a project.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="task-title">Title</Label><Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" /></div>
          <div className="space-y-2"><Label htmlFor="task-description">Description</Label><Textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Project</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Assignee</Label><Select value={assigneeId || 'unassigned'} onValueChange={(value) => setAssigneeId(value === 'unassigned' ? '' : value)}><SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{availableUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Priority</Label><Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label htmlFor="task-due-date">Due date</Label><Input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{task ? 'Save changes' : 'Create task'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
