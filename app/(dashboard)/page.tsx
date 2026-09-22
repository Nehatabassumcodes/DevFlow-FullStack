'use client';

import {
  FolderKanban,
  CheckSquare,
  CalendarClock,
  Activity as ActivityIcon,
  ArrowRight,
} from 'lucide-react';
import * as React from 'react';
import Link from 'next/link';
import { useData } from '@/lib/data-provider';
import { StatCard } from '@/components/dashboard/stat-card';
import { ProjectCard } from '@/components/dashboard/project-card';
import { TaskRow } from '@/components/dashboard/task-row';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { ProductivityChart } from '@/components/charts/productivity-chart';
import { StatusDonutChart } from '@/components/charts/status-donut-chart';
import { ErrorState } from '@/components/states/error-state';
import {
  StatCardSkeleton,
  ChartSkeleton,
  ProjectCardSkeleton,
  TaskRowSkeleton,
  ActivitySkeleton,
} from '@/components/states/skeletons';
import { Card } from '@/components/ui/card';
import { isOverdue } from '@/lib/helpers';
import type { Task } from '@/lib/types';

export default function DashboardPage() {
  const {
    projects,
    tasks,
    activities,
    currentUser,
    loading,
    error,
    retry,
    stats,
    statusDistribution,
    getProductivityTrend,
  } = useData();

  const weeklyProductivityData = React.useMemo(
    () => getProductivityTrend('week'),
    [getProductivityTrend]
  );

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  const priorityTasks = [...tasks]
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const aOverdue = isOverdue(a.dueDate, a.status) ? 0 : 1;
      const bOverdue = isOverdue(b.dueDate, b.status) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5) as Task[];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          Welcome back, {currentUser.name.trim().split(/\s+/)[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-fg">{dateStr}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Projects"
              value={stats.totalProjects}
              icon={<FolderKanban className="h-6 w-6" />}
              trend={stats.totalProjectsTrend}
              accentColor="hsl(var(--accent-blue))"
            />
            <StatCard
              label="Tasks Completed"
              value={stats.tasksCompleted}
              icon={<CheckSquare className="h-6 w-6" />}
              trend={stats.tasksCompletedTrend}
              accentColor="hsl(var(--success))"
            />
            <StatCard
              label="Tasks Due Today"
              value={stats.tasksDueToday}
              icon={<CalendarClock className="h-6 w-6" />}
              trend={stats.tasksDueTodayTrend}
              accentColor="hsl(var(--warning))"
            />
            <StatCard
              label="Productivity Score"
              value={stats.productivityScore}
              icon={<ActivityIcon className="h-6 w-6" />}
              trend={stats.productivityScoreTrend}
              accentColor="hsl(var(--accent-cyan))"
              isScore
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Weekly Productivity
              </h2>
              <p className="text-xs text-muted-fg">
                Productivity score over the past 7 days
              </p>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ProductivityChart data={weeklyProductivityData} />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Task Status
            </h2>
            <p className="text-xs text-muted-fg">Distribution of all tasks</p>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <>
              <StatusDonutChart data={statusDistribution} />
              <div className="mt-4 space-y-2">
                {statusDistribution.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-muted-fg">{item.status}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Project cards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Active Projects
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm font-medium text-accent-cyan hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {projects.slice(0, 4).map((project) => (
              <div
                key={project.id}
                className="min-w-[280px] max-w-[320px] snap-start"
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority tasks + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Priority Tasks
            </h2>
            <Link
              href="/tasks"
              className="flex items-center gap-1 text-sm font-medium text-accent-cyan hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <TaskRowSkeleton key={i} />
              ))}
            </div>
          ) : priorityTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-fg">
              No pending tasks. Great work!
            </p>
          ) : (
            <div className="space-y-3">
              {priorityTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showProject
                  showAssignee
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          {loading ? (
            <ActivitySkeleton />
          ) : (
            <ActivityTimeline />
          )}
        </Card>
      </div>
    </div>
  );
}
