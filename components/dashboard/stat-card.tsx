'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend: number;
  trendLabel?: string;
  accentColor?: string;
  isScore?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel = 'vs last week',
  accentColor = 'hsl(var(--accent-cyan))',
  isScore = false,
}: StatCardProps) {
  const isPositive = trend >= 0;

  return (
    <div className="group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent-cyan">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-fg">{label}</p>
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">
            {value}
            {isScore && (
              <span className="text-lg text-muted-fg font-normal">/100</span>
            )}
          </p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            isPositive ? 'text-success' : 'text-danger'
          )}
        >
          {isPositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(trend)}%
        </span>
        <span className="text-xs text-muted-fg">{trendLabel}</span>
      </div>
    </div>
  );
}
