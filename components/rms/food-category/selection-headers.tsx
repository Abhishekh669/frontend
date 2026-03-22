'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FolderOpen, Coffee, Trash2 } from 'lucide-react'

interface CategorySelectionHeaderProps {
  isActive: boolean
  selectedCount: number
  totalCount: number
  onToggleMode: () => void
  onClearSelection: () => void
  onDeleteSelected: () => void
  onSelectAll: () => void
}

export const CategorySelectionHeader = memo(function CategorySelectionHeader({
  isActive,
  selectedCount,
  totalCount,
  onToggleMode,
  onClearSelection,
  onDeleteSelected,
  onSelectAll
}: CategorySelectionHeaderProps) {
  return (
    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-20 py-3 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <FolderOpen className="h-4 w-4 text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Subcategories</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={onToggleMode}
            id="category-selection-mode"
          />
          <Label htmlFor="category-selection-mode" className="text-xs text-muted-foreground cursor-pointer">
            {isActive ? 'Selection On' : 'Select'}
          </Label>
        </div>
      </div>

      {isActive && selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {selectedCount} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-7 rounded-lg text-xs border-border hover:bg-muted/60"
          >
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            Clear
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="h-7 rounded-lg text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  )
})

interface MenuItemSelectionHeaderProps {
  isActive: boolean
  selectedCount: number
  totalCount: number
  onToggleMode: () => void
  onClearSelection: () => void
  onDeleteSelected: () => void
  onSelectAll: () => void
}

export const MenuItemSelectionHeader = memo(function MenuItemSelectionHeader({
  isActive,
  selectedCount,
  totalCount,
  onToggleMode,
  onClearSelection,
  onDeleteSelected,
  onSelectAll
}: MenuItemSelectionHeaderProps) {
  return (
    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-20 py-3 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Coffee className="h-4 w-4 text-violet-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Menu Items</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={onToggleMode}
            id="item-selection-mode"
          />
          <Label htmlFor="item-selection-mode" className="text-xs text-muted-foreground cursor-pointer">
            {isActive ? 'Selection On' : 'Select'}
          </Label>
        </div>
      </div>

      {isActive && selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {selectedCount} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-7 rounded-lg text-xs border-border hover:bg-muted/60"
          >
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            Clear
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="h-7 rounded-lg text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}
    </div>
  )
})