'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpen, Coffee } from 'lucide-react'

interface EmptyStateProps {
  type: 'categories' | 'items'
  searchTerm?: string
  onClear?: () => void
}

export const EmptyState = memo(function EmptyState({
  type,
  searchTerm,
  onClear
}: EmptyStateProps) {
  const Icon = type === 'categories' ? FolderOpen : Coffee
  const title = type === 'categories' ? 'No Categories Found' : 'No Menu Items Found'
  const message = searchTerm
    ? `No ${type} matching "${searchTerm}"`
    : type === 'categories'
      ? 'This category doesn\'t have any subcategories yet.'
      : 'This category doesn\'t have any menu items yet.'

  return (
    <div className="flex flex-col items-center justify-center py-16 col-span-full text-center">
      {/* Outer decorative ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
        <div className="relative w-16 h-16 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{message}</p>
      {searchTerm && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="mt-4 rounded-xl text-accent hover:text-accent hover:bg-accent/10 text-xs"
        >
          Clear search
        </Button>
      )}
    </div>
  )
})