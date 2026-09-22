'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PriorityBarChartProps {
  data: { project: string; completed: number; total: number }[];
}

export function PriorityBarChart({ data }: PriorityBarChartProps) {
  return (
    <div className="animate-chart-slide-up h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          barGap={2}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="project"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--popover-foreground))',
            }}
            cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--accent-blue) / 0.3)"
            name="Total"
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={700}
          />
          <Bar
            dataKey="completed"
            fill="hsl(var(--accent-cyan))"
            name="Completed"
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
