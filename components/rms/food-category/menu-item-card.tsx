'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Image as ImageIcon, 
  Edit2, 
  Trash2, 
  Package, 
  Clock, 
  DollarSign, 
  Tag,
  CheckSquare,
  Square
} from 'lucide-react'
import { MenuItem } from '@/utils/types/food-category.types'

interface MenuItemCardProps {
  item: MenuItem
  categoryName?: string
  isSelected: boolean
  isSelectionMode: boolean
  onSelect: (id: string, checked: boolean) => void
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
  onToggleAvailability: (item : MenuItem) => void
}

export const MenuItemCard = memo(function MenuItemCard({
  item,
  categoryName,
  isSelected,
  isSelectionMode,
  onSelect,
  onEdit,
  onDelete,
  onToggleAvailability
}: MenuItemCardProps) {
  const isAvailable = item.is_available
  const formattedPrice = typeof item.price === 'number'
    ? item.price.toFixed(2)
    : parseFloat(item.price as any).toFixed(2)

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleAvailability(item);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelectionMode) {
      onSelect(item.id, !isSelected);
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-all h-95 flex flex-col ${
        !isAvailable ? 'opacity-75' : 'hover:shadow-lg'
      } ${
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
          : isSelectionMode 
            ? 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1' 
            : ''
      }`}
      onClick={handleSelect}
    >
      {/* Image section */}
      <div className="relative h-36 w-full bg-linear-to-br from-gray-100 to-gray-200 shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        {/* Availability overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm font-semibold">Currently Unavailable</Badge>
          </div>
        )}
        
        {/* Selection button - only show in selection mode */}
        {isSelectionMode && (
          <button
            onClick={handleSelect}
            className="absolute top-2 left-2 z-10 focus:outline-none hover:scale-110 transition-transform"
            aria-label={isSelected ? 'Deselect item' : 'Select item'}
          >
            {isSelected ? (
              <div className="bg-white rounded-full shadow-lg p-0.5">
                <CheckSquare className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-md p-0.5 hover:bg-white">
                <Square className="h-6 w-6 text-gray-600" />
              </div>
            )}
          </button>
        )}
        
        {/* Display order badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm shadow-sm"
        >
          Order: {item.display_order}
        </Badge>
      </div>

      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{item.name}</CardTitle>
            {categoryName && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <span className="truncate">{categoryName}</span>
              </p>
            )}
          </div>
          <div className="text-lg font-bold text-primary whitespace-nowrap shrink-0">
            Rs {formattedPrice}
          </div>
        </div>  
      </CardHeader>

      {/* Content area with better organization */}
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-2">
          {/* Description */}
          {item.description && (
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          )}
          
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              <span>ID: {item.id.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Price: Rs {formattedPrice}</span>
            </div>
          </div>

          {/* Status badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant={isAvailable ? "default" : "destructive"} className="text-xs">
              {isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
            {item.display_order <= 5 && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Action buttons */}
      <CardFooter className="pt-2 border-t mt-auto shrink-0">
        <div className="flex w-full gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleToggle}
          >
            {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleEdit}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
})