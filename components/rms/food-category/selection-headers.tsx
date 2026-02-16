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
    <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-20 py-3 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Subcategories</h2>
          <Badge variant="outline" className="ml-2">{totalCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={onToggleMode}
            id="category-selection-mode"
          />
          <Label htmlFor="category-selection-mode" className="text-sm font-medium">
            {isActive ? 'Selection Mode On' : 'Enable Selection'}
          </Label>
        </div>
      </div>
      
      {isActive && selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} categor{selectedCount > 1 ? 'ies' : 'y'} selected
          </Badge>
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDeleteSelected}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
    </div>
  );
});

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
    <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-20 py-3 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Menu Items</h2>
          <Badge variant="outline" className="ml-2">{totalCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={onToggleMode}
            id="item-selection-mode"
          />
          <Label htmlFor="item-selection-mode" className="text-sm font-medium">
            {isActive ? 'Selection Mode On' : 'Enable Selection'}
          </Label>
        </div>
      </div>
      
      {isActive && selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </Badge>
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDeleteSelected}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
    </div>
  );
});