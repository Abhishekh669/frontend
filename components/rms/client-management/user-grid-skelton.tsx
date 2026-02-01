"use client"

import { Card, CardContent } from "@/components/ui/card";

export function UsersGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-3 bg-muted rounded w-1/2 mx-auto" />

            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>

            <div className="h-8 bg-muted rounded w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
