import type { AnalyticsData } from '@/lib/types';

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeeklyTrend() {
  const scores = [68, 72, 65, 78, 82, 75, 88];
  const tasks = [3, 4, 2, 5, 6, 3, 7];
  return dayNames.map((date, i) => ({
    date,
    score: scores[i],
    tasksCompleted: tasks[i],
  }));
}

function getMonthlyTrend() {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const scores = [70, 76, 82, 88];
  const tasks = [12, 15, 18, 22];
  return weeks.map((date, i) => ({
    date,
    score: scores[i],
    tasksCompleted: tasks[i],
  }));
}

export function getAnalyticsData(range: 'week' | 'month'): AnalyticsData {
  return {
    productivityTrend:
      range === 'week' ? getWeeklyTrend() : getMonthlyTrend(),
    completionByProject: [
      { project: 'Atlas', completed: 1, total: 5 },
      { project: 'Orbit', completed: 1, total: 4 },
      { project: 'Nimbus', completed: 1, total: 4 },
      { project: 'Pulse', completed: 0, total: 3 },
      { project: 'Verge', completed: 1, total: 4 },
      { project: 'Helix', completed: 1, total: 4 },
    ],
    distributionByPriority: [
      {
        priority: 'Low',
        count: 7,
        fill: 'hsl(187 85% 53%)',
      },
      {
        priority: 'Medium',
        count: 10,
        fill: 'hsl(38 92% 50%)',
      },
      {
        priority: 'High',
        count: 7,
        fill: 'hsl(0 72% 51%)',
      },
    ],
  };
}
