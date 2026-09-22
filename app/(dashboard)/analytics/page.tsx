'use client';

import * as React from 'react';
import { Download, TrendingUp, CheckCircle2, Clock, Target } from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { ProductivityChart } from '@/components/charts/productivity-chart';
import { StatusDonutChart } from '@/components/charts/status-donut-chart';
import { PriorityBarChart } from '@/components/charts/priority-bar-chart';
import { ErrorState } from '@/components/states/error-state';
import { ChartSkeleton } from '@/components/states/skeletons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const {
    loading,
    error,
    retry,
    tasks,
    projects,
    priorityDistribution,
    getProductivityTrend,
  } = useData();
  const [range, setRange] = React.useState<'week' | 'month'>('week');

  const productivityTrend = React.useMemo(
    () => getProductivityTrend(range),
    [getProductivityTrend, range]
  );

  const completionByProject = React.useMemo(() => {
    return projects.map((p) => ({
      project: p.name.split(' ')[0],
      completed: tasks.filter(
        (t) => t.projectId === p.id && t.status === 'done'
      ).length,
      total: tasks.filter((t) => t.projectId === p.id).length,
    }));
  }, [tasks, projects]);

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const handleDownload = () => {
    toast.success('Report download started', {
      description: 'Your analytics report is being generated.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            Track your productivity and task completion trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={range} onValueChange={(v) => setRange(v as 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download report</span>
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Completion Rate',
            value: `${completionRate}%`,
            icon: Target,
            color: 'text-accent-cyan',
            bg: 'bg-accent-cyan/10',
          },
          {
            label: 'Tasks Completed',
            value: completedTasks,
            icon: CheckCircle2,
            color: 'text-success',
            bg: 'bg-success/10',
          },
          {
            label: 'In Progress',
            value: inProgressTasks,
            icon: Clock,
            color: 'text-accent-violet',
            bg: 'bg-accent-violet/10',
          },
          {
            label: 'Avg Score',
            value: Math.round(
              productivityTrend.reduce((s, d) => s + d.score, 0) /
                productivityTrend.length
            ),
            icon: TrendingUp,
            color: 'text-accent-blue',
            bg: 'bg-accent-blue/10',
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-fg">{stat.label}</p>
                <p className="font-heading text-xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
            Productivity Trend
          </h2>
          <p className="mb-4 text-xs text-muted-fg">
            Score over {range === 'week' ? 'the past week' : 'the past month'}
          </p>
          {loading ? <ChartSkeleton /> : <ProductivityChart data={productivityTrend} />}
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
            Task Distribution by Priority
          </h2>
          <p className="mb-4 text-xs text-muted-fg">
            How tasks are distributed across priority levels
          </p>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <>
              <StatusDonutChart
                data={priorityDistribution.map((d) => ({
                  status: d.priority,
                  count: d.count,
                  fill: d.fill,
                }))}
              />
              <div className="mt-4 space-y-2">
                {priorityDistribution.map((item) => (
                  <div
                    key={item.priority}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-muted-fg">{item.priority} Priority</span>
                    </div>
                    <span className="font-medium text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-1 font-heading text-lg font-semibold text-foreground">
          Task Completion by Project
        </h2>
        <p className="mb-4 text-xs text-muted-fg">
          Completed vs total tasks per project
        </p>
        {loading ? <ChartSkeleton /> : <PriorityBarChart data={completionByProject} />}
      </Card>
    </div>
  );
}


