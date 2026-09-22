'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Columns3,
  Users,
  BarChart3,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/kanban', label: 'Kanban Board', icon: Columns3 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'sidebar-bg fixed left-0 top-0 z-30 hidden h-full flex-col border-r sidebar-border transition-all duration-250 ease-in-out md:flex',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b sidebar-border">
        <div className="gradient-logo flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <span className="font-heading text-lg font-bold text-white">D</span>
        </div>
        {!collapsed && (
          <span
            className={cn(
              'font-heading text-lg font-bold text-white transition-opacity duration-200',
              collapsed && 'opacity-0'
            )}
          >
            DevFlow
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'sidebar-active-bg sidebar-text-active'
                  : 'sidebar-text hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-cyan" />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span
                  className={cn(
                    'transition-opacity duration-200',
                    collapsed ? 'opacity-0' : 'opacity-100'
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t sidebar-border p-3">
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium sidebar-text hover:text-white hover:bg-white/5 transition-colors focus-ring'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
