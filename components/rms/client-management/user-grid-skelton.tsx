"use client"

export function UsersGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card overflow-hidden p-5 space-y-4"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted" />
            <div className="h-3 w-28 bg-muted rounded-full" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-5 w-14 bg-muted rounded-full" />
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <div className="h-2.5 bg-muted rounded-full w-full" />
            <div className="h-2.5 bg-muted rounded-full w-4/5" />
            <div className="h-2.5 bg-muted rounded-full w-3/5" />
          </div>

          {/* Action row */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <div className="h-8 w-8 bg-muted rounded-lg" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}