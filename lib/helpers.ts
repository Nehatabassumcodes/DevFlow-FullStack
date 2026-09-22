import type { TaskPriority, ProjectHealth, TaskStatus, ClientStatus } from '@/lib/types';

export const priorityConfig: Record<
  TaskPriority,
  { label: string; color: string; bg: string; dot: string }
> = {
  low: {
    label: 'Low',
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
    dot: 'bg-accent-cyan',
  },
  medium: {
    label: 'Medium',
    color: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
  },
  high: {
    label: 'High',
    color: 'text-danger',
    bg: 'bg-danger/10',
    dot: 'bg-danger',
  },
};

export const healthConfig: Record<
  ProjectHealth,
  { label: string; color: string; bg: string; dot: string }
> = {
  'on-track': {
    label: 'On Track',
    color: 'text-success',
    bg: 'bg-success/10',
    dot: 'bg-success',
  },
  'at-risk': {
    label: 'At Risk',
    color: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-danger',
    bg: 'bg-danger/10',
    dot: 'bg-danger',
  },
};

export const statusConfig: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  backlog: { label: 'Backlog', color: 'text-muted-fg' },
  todo: { label: 'To Do', color: 'text-accent-blue' },
  'in-progress': { label: 'In Progress', color: 'text-accent-violet' },
  'in-review': { label: 'In Review', color: 'text-warning' },
  done: { label: 'Done', color: 'text-success' },
};

export const clientStatusConfig: Record<
  ClientStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  active: {
    label: 'Active',
    color: 'text-success',
    bg: 'bg-success/10',
    dot: 'bg-success',
  },
  prospect: {
    label: 'Prospect',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
    dot: 'bg-accent-blue',
  },
  'on-hold': {
    label: 'On Hold',
    color: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
  },
  archived: {
    label: 'Archived',
    color: 'text-muted-fg',
    bg: 'bg-muted',
    dot: 'bg-muted-fg',
  },
};

const avatarPalette = [
  'hsl(187 85% 53%)',
  'hsl(258 90% 66%)',
  'hsl(217 91% 60%)',
  'hsl(160 84% 39%)',
  'hsl(38 92% 50%)',
  'hsl(0 72% 51%)',
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

export const statusOrder: TaskStatus[] = [
  'backlog',
  'todo',
  'in-progress',
  'in-review',
  'done',
];

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays < 7) return `In ${diffDays}d`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function isOverdue(dueDate: string, status: TaskStatus): boolean {
  if (status === 'done') return false;
  return new Date(dueDate).getTime() < Date.now();
}

// Case-insensitive search: every whitespace-separated term in `query` must
// appear in at least one of the given fields. An empty query matches everything.
export function matchesSearch(
  fields: (string | undefined | null)[],
  query: string
): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
