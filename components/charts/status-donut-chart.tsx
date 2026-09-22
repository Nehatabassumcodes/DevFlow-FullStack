'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusDonutChartProps {
  data: { status: string; count: number; fill: string }[];
}

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  return (
    <div className="animate-chart-slide-up relative h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="status"
            isAnimationActive
            animationDuration={700}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-heading text-2xl font-bold text-foreground">
          {data.reduce((sum, d) => sum + d.count, 0)}
        </span>
        <span className="text-xs text-muted-fg">Total Tasks</span>
      </div>
    </div>
  );
}
