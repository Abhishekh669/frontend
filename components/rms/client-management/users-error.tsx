"use client"

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UsersError({ onRetry, title }: { onRetry?: () => void; title: string }) {
  return (
    <div className="flex justify-center py-16">
      <div className="flex flex-col items-center text-center max-w-xs">

        {/* Icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-sm">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div className="absolute inset-0 rounded-3xl border border-destructive/15 scale-110 opacity-40" />
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          Something went wrong
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Failed to load {title}. Please check your connection and try again.
        </p>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="h-8 text-xs rounded-xl mt-5 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        )}

      </div>
    </div>
  );
}