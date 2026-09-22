'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Flame,
  Clock,
  Mail,
  Briefcase,
} from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { UserAvatar } from '@/components/dashboard/user-avatar';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Task } from '@/lib/types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 86400000;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function pluralDays(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

// Consecutive days (ending today, or yesterday if nothing is done yet today)
// on which at least one of the user's tasks was completed.
function getCompletionStreak(completed: Task[]): number {
  const days = new Set<string>();
  completed.forEach((t) => {
    if (t.completedAt) days.add(dayKey(new Date(t.completedAt)));
  });
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Average days from creation to completion across the user's completed tasks.
function getAvgCompletionDays(completed: Task[]): number | null {
  const durations = completed
    .filter((t) => t.completedAt)
    .map((t) =>
      Math.max(
        0,
        (new Date(t.completedAt as string).getTime() -
          new Date(t.createdAt).getTime()) /
          DAY_MS
      )
    );
  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

export default function ProfilePage() {
  const { tasks, activities, currentUser, updateProfile } = useData();

  const [name, setName] = React.useState(currentUser.name);
  const [email, setEmail] = React.useState(currentUser.email);
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>(
    {}
  );

  // Keep the form in sync when the provider's user changes (e.g. after a reload).
  React.useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setErrors({});
  }, [currentUser.name, currentUser.email]);

  const isDirty =
    name.trim() !== currentUser.name || email.trim() !== currentUser.email;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: { name?: string; email?: string } = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailRegex.test(email.trim()))
      nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateProfile({
      name: name.trim(),
      email: email.trim(),
      role: currentUser.role,
    });
    toast.success('Profile updated', {
      description: 'Your account details were saved.',
    });
  };

  const userTasks = tasks.filter((t) => t.assigneeId === currentUser.id);
  const completedUserTasks = userTasks.filter((t) => t.status === 'done');
  const completedTasks = completedUserTasks.length;
  const streak = getCompletionStreak(completedUserTasks);
  const avgCompletionDays = getAvgCompletionDays(completedUserTasks);
  const userActivities = activities.filter(
    (a) => a.userId === currentUser.id
  );

  const stats = [
    {
      label: 'Tasks Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Current Streak',
      value: pluralDays(streak),
      icon: Flame,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Avg Completion',
      value:
        avgCompletionDays === null
          ? '—'
          : pluralDays(Math.round(avgCompletionDays * 10) / 10),
      icon: Clock,
      color: 'text-accent-blue',
      bg: 'bg-accent-blue/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          Manage your account and preferences
        </p>
      </div>

      {/* User card */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <UserAvatar user={currentUser} size="lg" className="h-20 w-20" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-heading text-xl font-bold text-foreground">
              {currentUser.name}
            </h2>
            <p className="mt-1 text-sm text-muted-fg">{currentUser.role}</p>
            <div className="mt-3 flex flex-col items-center gap-2 text-sm text-muted-fg sm:flex-row sm:items-start">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {currentUser.email}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Engineering Team
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Settings */}
        <Card className="p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
            Preferences
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Theme preference
                </p>
                <p className="text-xs text-muted-fg">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Account settings */}
          <form
            id="account-settings"
            onSubmit={handleSave}
            noValidate
            className="mt-6 scroll-mt-20 space-y-4 border-t pt-6"
          >
            <h3 className="text-sm font-semibold text-foreground">
              Account Settings
            </h3>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-danger">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-danger">
                  {errors.email}
                </p>
              )}
            </div>
            <Button type="submit" disabled={!isDirty}>
              Save changes
            </Button>
          </form>
        </Card>

        {/* Recent personal activity */}
        <Card className="p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          {userActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-fg">
              No recent activity to show.
            </p>
          ) : (
            <ActivityTimeline />
          )}
        </Card>
      </div>
    </div>
  );
}
