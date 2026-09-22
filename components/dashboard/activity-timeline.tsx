'use client';

import {
  CheckCircle2,
  CircleDot,
  MessageSquare,
  FolderPlus,
  FolderCog,
  UserPlus,
  UserCog,
  ArrowRightLeft,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { formatRelativeTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/lib/types';

const activityConfig: Record<
  ActivityType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  'task-completed': {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  'task-created': {
    icon: Plus,
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  'task-updated': {
    icon: Pencil,
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  'task-deleted': {
    icon: Trash2,
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
  'project-created': {
    icon: FolderPlus,
    color: 'text-accent-violet',
    bg: 'bg-accent-violet/10',
  },
  'project-updated': {
    icon: FolderCog,
    color: 'text-accent-violet',
    bg: 'bg-accent-violet/10',
  },
  'project-deleted': {
    icon: Trash2,
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
  comment: {
    icon: MessageSquare,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
  },
  'status-changed': {
    icon: ArrowRightLeft,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  'member-joined': {
    icon: UserPlus,
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  'client-created': {
    icon: UserPlus,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  'client-updated': {
    icon: UserCog,
    color: 'text-success',
    bg: 'bg-success/10',
  },
  'client-deleted': {
    icon: Trash2,
    color: 'text-danger',
    bg: 'bg-danger/10',
  },
  'profile-updated': {
    icon: Pencil,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
  },
};

export const activityMessages: Record<ActivityType, (name: string, user: string) => string> = {
  'task-completed': (name) => `completed task "${name}"`,
  'task-created': (name) => `created task "${name}"`,
  'task-updated': (name) => `updated task "${name}"`,
  'task-deleted': (name) => `deleted task "${name}"`,
  'project-created': (name) => `created project "${name}"`,
  'project-updated': (name) => `updated project "${name}"`,
  'project-deleted': (name) => `deleted project "${name}"`,
  comment: (name) => `commented on "${name}"`,
  'status-changed': (name) => `changed status of "${name}"`,
  'member-joined': (name) => `joined project "${name}"`,
  'client-created': (name) => `added client "${name}"`,
  'client-updated': (name) => `updated client "${name}"`,
  'client-deleted': (name) => `deleted client "${name}"`,
  'profile-updated': () => `updated their profile`,
};

export function ActivityTimeline() {
  const { activities, getUser } = useData();

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const user = getUser(activity.userId);
        const Icon = config.icon;
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  config.bg,
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>
            <div className={cn('flex-1', isLast ? '' : 'pb-4')}>
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  {user?.name || 'Someone'}
                </span>{' '}
                <span className="text-muted-fg">
                  {activityMessages[activity.type](
                    activity.targetName,
                    user?.name || ''
                  )}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-fg" suppressHydrationWarning>
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
