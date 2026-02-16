'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FolderOpen, ChevronRight, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react'
import { Category } from '@/utils/types/food-category.types'

interface CategoryCardProps {
  category: Category
  isSelected: boolean
  isSelectionMode: boolean
  onSelect: (id: string, checked: boolean) => void
  onEdit: (category: Category) => void
  currentPath: string
  onDelete: (id: string) => void
}

export const CategoryCard = memo(function CategoryCard({
  category,
  isSelected,
  isSelectionMode,
  onSelect,
  onEdit,
  onDelete,
  currentPath
}: CategoryCardProps) {
  console.log("this is category slug : ", category.slug)
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(category);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(category.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    if(!isSelectionMode)return;
    e.preventDefault();
    e.stopPropagation();
      onSelect(category.id, !isSelected);
  };

  return (
    <div className="relative group">
      <Link href={`/food-category/${currentPath}/${category.slug}`}>
        <Card 
          className={`hover:shadow-lg transition-all duration-300 cursor-pointer h-50 flex flex-col ${
            isSelected 
              ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
              : isSelectionMode 
                ? 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1' 
                : ''
          }`}
          onClick={handleSelect}
        >
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isSelectionMode && (
                  <button
                    onClick={handleSelect}
                    className="shrink-0 focus:outline-none hover:scale-110 transition-transform"
                    aria-label={isSelected ? 'Deselect category' : 'Select category'}
                  >
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5 text-primary fill-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    )}
                  </button>
                )}
                <CardTitle className="text-lg flex items-center gap-2 min-w-0">
                  <FolderOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">{category.name}</span>
                </CardTitle>
              </div>
              <Badge variant="secondary" className="shrink-0 ml-2">Level {category.level}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <p className="text-sm text-muted-foreground line-clamp-2">
              Browse subcategories and items in {category.name}
            </p>
          </CardContent>
          <CardFooter className="pt-2 shrink-0 border-t">
            <div className="flex w-full gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 gap-2 group-hover:bg-primary/5"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                  View
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
})