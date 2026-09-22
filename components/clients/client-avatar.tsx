'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/lib/helpers';

interface ClientAvatarProps {
  id: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-9 w-9',
  lg: 'h-14 w-14',
};

const textSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-lg',
};

export function ClientAvatar({ id, name, size = 'md', className }: ClientAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], 'border-2 border-background', className)}>
      <AvatarFallback
        className={cn('font-semibold text-white', textSizeClasses[size])}
        style={{ backgroundColor: getAvatarColor(id) }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
