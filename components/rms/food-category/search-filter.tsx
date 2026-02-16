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
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search categories and menu items..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  )
})