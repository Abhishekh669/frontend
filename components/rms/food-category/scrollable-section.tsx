'use client'

import { memo, ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ScrollableSectionProps {
  children: ReactNode
  className?: string
}

export const ScrollableSection = memo(function ScrollableSection({
  children,
  className = ""
}: ScrollableSectionProps) {
  return (
    <ScrollArea className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {children}
      </div>
    </ScrollArea>
  )
})