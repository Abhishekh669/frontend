"use client"

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UsersError({ onRetry, title }: { onRetry?: () => void, title : string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Failed to load {title}. Please try again.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      )}
    </div>
  );
}
