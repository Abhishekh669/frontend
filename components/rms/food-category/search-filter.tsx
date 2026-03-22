'use client'

import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchFilterProps {
  onSearch: (term: string) => void
  searchTerm: string
}

export const SearchFilter = memo(function SearchFilter({
  onSearch,
  searchTerm
}: SearchFilterProps) {
  return (
    <div className="relative max-w-md flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search categories and menu items..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors w-full"
      />
    </div>
  )
})