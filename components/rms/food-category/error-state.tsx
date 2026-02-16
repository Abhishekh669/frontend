'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  onRefresh: () => void
}

export const ErrorState = memo(function ErrorState({ onRefresh }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="border-red-500 bg-red-50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Category</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex items-center justify-between">
          <span>Failed to load category. Please try again.</span>
          <Button onClick={onRefresh} variant="outline" size="sm" className="ml-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
})