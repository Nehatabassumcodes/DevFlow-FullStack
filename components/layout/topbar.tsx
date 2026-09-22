'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { SidebarMobileContent } from '@/components/layout/sidebar-mobile-content';
import { useData } from '@/lib/data-provider';
import { formatRelativeTime, matchesSearch } from '@/lib/helpers';
import { activityMessages } from '@/components/dashboard/activity-timeline';
import type { ActivityType } from '@/lib/types';
import { useAuth } from '@/lib/auth';

const notificationTitles: Record<ActivityType, string> = {
  'task-completed': 'Task completed',
  'task-created': 'New task',
  'task-updated': 'Task updated',
  'task-deleted': 'Task deleted',
  'project-created': 'New project',
  'project-updated': 'Project updated',
  'project-deleted': 'Project deleted',
  comment: 'New comment',
  'status-changed': 'Status changed',
  'member-joined': 'New member',
  'client-created': 'New client',
  'client-updated': 'Client updated',
  'client-deleted': 'Client deleted',
  'profile-updated': 'Profile updated',
};

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  // ISO timestamp; items without one are shown as "Today".
  timestamp?: string;
}

const MAX_NOTIFICATIONS = 5;
const MAX_RESULTS_PER_GROUP = 5;

const resultLinkClass =
  'flex flex-col gap-0.5 rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const [query, setQuery] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    currentUser,
    tasks,
    projects,
    activities,
    loading,
    getUser,
    getProject,
  } = useData();
  const { logout } = useAuth();

  // Notifications come from app data: the user's open tasks due today, then
  // recent activity by other people (the user's own actions are left out).
  const notifications = React.useMemo<NotificationItem[]>(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const dueToday = tasks
      .filter((t) => {
        if (t.assigneeId !== currentUser.id || t.status === 'done') return false;
        const due = new Date(t.dueDate);
        return due >= startOfToday && due < startOfTomorrow;
      })
      .map((t) => ({
        id: `due-${t.id}`,
        title: 'Task due today',
        message: t.title,
      }));

    const fromOthers = activities
      .filter((a) => a.userId !== currentUser.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .map((a) => {
        const name = getUser(a.userId)?.name ?? 'Someone';
        return {
          id: a.id,
          title: notificationTitles[a.type],
          message: `${name} ${activityMessages[a.type](a.targetName, name)}`,
          timestamp: a.timestamp,
        };
      });

    return [...dueToday, ...fromOthers].slice(0, MAX_NOTIFICATIONS);
  }, [tasks, activities, currentUser, getUser]);

  const trimmedQuery = query.trim();

  // Tasks match on title, description, project and assignee; projects on name
  // and description. Only the first few of each are shown.
  const results = React.useMemo(() => {
    if (!trimmedQuery) {
      return { tasks: [], projects: [], taskTotal: 0, projectTotal: 0 };
    }
    const matchedTasks = tasks.filter((t) =>
      matchesSearch(
        [
          t.title,
          t.description,
          getProject(t.projectId)?.name,
          getUser(t.assigneeId)?.name,
        ],
        trimmedQuery
      )
    );
    const matchedProjects = projects.filter((p) =>
      matchesSearch([p.name, p.description], trimmedQuery)
    );
    return {
      tasks: matchedTasks.slice(0, MAX_RESULTS_PER_GROUP),
      projects: matchedProjects.slice(0, MAX_RESULTS_PER_GROUP),
      taskTotal: matchedTasks.length,
      projectTotal: matchedProjects.length,
    };
  }, [trimmedQuery, tasks, projects, getProject, getUser]);

  // Close the results when the user clicks or tabs outside the search box.
  React.useEffect(() => {
    if (!searchOpen) return;
    const handleOutside = (e: Event) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
    };
  }, [searchOpen]);

  const finishSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  // Tasks open their project (the tasks list has no per-task page).
  const firstResultHref = results.tasks[0]
    ? `/projects/${results.tasks[0].projectId}`
    : results.projects[0]
      ? `/projects/${results.projects[0].id}`
      : null;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'Enter' && firstResultHref) {
      router.push(firstResultHref);
      finishSearch();
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
    toast.success('Logged out', {
      description: 'Your session has ended.',
    });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden focus-ring"
        aria-label="Open navigation menu"
        onClick={onOpenMobileSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
        <Input
          placeholder="Search tasks, projects..."
          className="pl-9 bg-surface-muted border-transparent focus-visible:bg-background"
          aria-label="Search"
          aria-expanded={searchOpen && !!trimmedQuery}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={handleSearchKeyDown}
        />

        {searchOpen && trimmedQuery && (
          <div
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            role="region"
            aria-label="Search results"
          >
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-fg">
                Loading...
              </p>
            ) : results.taskTotal + results.projectTotal === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-fg">
                No results for &ldquo;{trimmedQuery}&rdquo;
              </p>
            ) : (
              <>
                {results.tasks.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-fg">
                      Tasks
                    </p>
                    {results.tasks.map((t) => (
                      <Link
                        key={t.id}
                        href={`/projects/${t.projectId}`}
                        onClick={finishSearch}
                        className={resultLinkClass}
                      >
                        <span className="truncate font-medium">{t.title}</span>
                        <span className="truncate text-xs text-muted-fg">
                          {[
                            getProject(t.projectId)?.name,
                            getUser(t.assigneeId)?.name,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </Link>
                    ))}
                    {results.taskTotal > results.tasks.length && (
                      <p className="px-3 py-1 text-xs text-muted-fg">
                        +{results.taskTotal - results.tasks.length} more tasks
                      </p>
                    )}
                  </div>
                )}
                {results.projects.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-fg">
                      Projects
                    </p>
                    {results.projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        onClick={finishSearch}
                        className={resultLinkClass}
                      >
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="truncate text-xs text-muted-fg">
                          {p.description}
                        </span>
                      </Link>
                    ))}
                    {results.projectTotal > results.projects.length && (
                      <p className="px-3 py-1 text-xs text-muted-fg">
                        +{results.projectTotal - results.projects.length} more
                        projects
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative focus-ring"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-fg">
                No notifications
              </p>
            )}
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-1 py-3"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-xs text-muted-fg">
                    {n.timestamp ? formatRelativeTime(n.timestamp) : 'Today'}
                  </span>
                </div>
                <span className="text-xs text-muted-fg">{n.message}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="focus-ring rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarFallback
                  className="text-white text-xs font-semibold"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{currentUser.name}</span>
                <span className="text-xs text-muted-fg font-normal">
                  {currentUser.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile#account-settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={handleLogout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
