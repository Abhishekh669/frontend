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
    <div className="text-center py-12 col-span-full">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-muted rounded-full">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{message}</p>
      {searchTerm && onClear && (
        <Button variant="link" onClick={onClear} className="mt-2">
          Clear search
        </Button>
      )}
    </div>
  )
})