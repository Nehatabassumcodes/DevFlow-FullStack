import { cn } from '@/lib/utils';

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-8 w-16 rounded" />
        </div>
        <div className="shimmer h-12 w-12 rounded-xl" />
      </div>
      <div className="shimmer mt-4 h-4 w-20 rounded" />
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="shimmer h-5 w-32 rounded" />
      <div className="shimmer mt-2 h-4 w-full rounded" />
      <div className="shimmer mt-1 h-4 w-3/4 rounded" />
      <div className="shimmer mt-4 h-2 w-full rounded-full" />
      <div className="mt-4 flex items-center justify-between">
        <div className="shimmer h-6 w-16 rounded-full" />
        <div className="shimmer h-6 w-20 rounded" />
      </div>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="shimmer h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-4 w-48 rounded" />
        <div className="shimmer h-3 w-32 rounded" />
      </div>
      <div className="shimmer h-6 w-16 rounded-full" />
      <div className="shimmer h-8 w-8 rounded-full" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="shimmer h-5 w-40 rounded" />
      <div className="shimmer mt-6 h-[200px] w-full rounded-lg" />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="shimmer h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="shimmer h-4 w-3/4 rounded" />
            <div className="shimmer h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClientRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="shimmer h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-4 w-40 rounded" />
        <div className="shimmer h-3 w-28 rounded" />
      </div>
      <div className="shimmer hidden h-4 w-24 rounded sm:block" />
      <div className="shimmer hidden h-4 w-20 rounded md:block" />
      <div className="shimmer h-6 w-16 rounded-full" />
      <div className="shimmer h-8 w-8 rounded-full" />
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex-1 space-y-3">
      <div className="shimmer h-6 w-24 rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border bg-card p-4 shadow-sm space-y-2'
          )}
        >
          <div className="shimmer h-4 w-full rounded" />
          <div className="shimmer h-3 w-2/3 rounded" />
          <div className="flex items-center justify-between pt-2">
            <div className="shimmer h-5 w-16 rounded-full" />
            <div className="shimmer h-6 w-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
