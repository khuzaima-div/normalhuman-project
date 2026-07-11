import { cn } from "@/lib/utils";

export function ThreadListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-zinc-200/35 bg-white p-4 shadow-sm dark:border-zinc-800/45 dark:bg-zinc-900"
        >
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmailBodySkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="mt-6 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}
