'use client'

import { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const CategoryLoadingSkeleton = memo(function CategoryLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-56 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
})