'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Category, MenuItem } from '@/utils/types/food-category.types'

interface CategoryDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  categories: Category[]
  isDeleting?: boolean
}

export const CategoryDeleteDialog = memo(function CategoryDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  categories,
  isDeleting = false
}: CategoryDeleteDialogProps) {
    
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Categories</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {categories.length} selected categor{categories.length > 1 ? 'ies' : 'y'}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {categories.length > 0 && (
          <ScrollArea className="max-h-50 border rounded-md p-2">
            <div className="space-y-2">
              <p className="font-semibold text-sm mb-1">Categories:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {categories.map(cat => (
                  <li key={cat.id} className="text-muted-foreground">
                    {cat.name} (Level {cat.level})
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e)=>{
              e.preventDefault();
              onConfirm();
            }} 
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

interface MenuItemDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  items: MenuItem[]
  isDeleting?: boolean
}

export const MenuItemDeleteDialog = memo(function MenuItemDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  items,
  isDeleting = false
}: MenuItemDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Menu Items</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {items.length} selected menu {items.length > 1 ? 'items' : 'item'}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {items.length > 0 && (
          <ScrollArea className="max-h-50 border rounded-md p-2">
            <div className="space-y-2">
              <p className="font-semibold text-sm mb-1">Menu Items:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {items.map(item => {
                  const price = typeof item.price === 'number' 
                    ? item.price.toFixed(2) 
                    : item.price;
                  return (
                    <li key={item.id} className="text-muted-foreground">
                      {item.name} - Rs {price}
                    </li>
                  );
                })}
              </ul>
            </div>
          </ScrollArea>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e)=> {
              e.preventDefault();
              onConfirm();
            }} 
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});