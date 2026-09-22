'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const textSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], 'border-2 border-background', className)}>
      <AvatarFallback
        className={cn(
          'font-semibold text-white',
          textSizeClasses[size]
        )}
        style={{ backgroundColor: user.avatarColor }}
      >
        {user.initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user) => (
        <UserAvatar key={user.id} user={user} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full border-2 border-background bg-muted text-muted-fg font-semibold',
            sizeClasses[size],
            textSizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
