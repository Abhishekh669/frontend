'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  onRefresh: () => void
}

export const ErrorState = memo(function ErrorState({ onRefresh }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Outer decorative ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-110 rounded-3xl border border-destructive/20" />
        <div className="relative w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">Failed to Load</h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-5">
        Something went wrong while loading the category data. Please try again.
      </p>
      <Button
        onClick={onRefresh}
        variant="outline"
        size="sm"
        className="rounded-xl gap-2 border-border hover:bg-muted/40 text-xs"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </Button>
    </div>
  )
})