'use client'

import { memo } from 'react'
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
import { Loader2, Trash2 } from 'lucide-react'
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
      <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <AlertDialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Delete Categories
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                Are you sure you want to delete {categories.length} selected categor{categories.length > 1 ? 'ies' : 'y'}? This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {categories.length > 0 && (
          <div className="px-6 py-4">
            <ScrollArea className="max-h-40 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Categories to delete
              </p>
              <ul className="space-y-1">
                {categories.map(cat => (
                  <li key={cat.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 shrink-0" />
                    {cat.name}
                    <span className="text-[10px] text-muted-foreground/60">Level {cat.level}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <AlertDialogFooter className="px-6 pb-6 flex justify-end gap-2 pt-4 border-t border-border">
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-xl h-9 text-sm border-border bg-muted/30 hover:bg-muted/60"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            disabled={isDeleting}
            className="rounded-xl h-9 text-sm bg-destructive hover:bg-destructive/90 text-white min-w-24 gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})

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
      <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <AlertDialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Delete Menu Items
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                Are you sure you want to delete {items.length} selected menu {items.length > 1 ? 'items' : 'item'}? This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {items.length > 0 && (
          <div className="px-6 py-4">
            <ScrollArea className="max-h-40 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                Items to delete
              </p>
              <ul className="space-y-1">
                {items.map(item => {
                  const price = typeof item.price === 'number' ? item.price.toFixed(2) : item.price
                  return (
                    <li key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 shrink-0" />
                      <span className="text-foreground font-medium">{item.name}</span>
                      <span className="text-muted-foreground/70">Rs {price}</span>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </div>
        )}

        <AlertDialogFooter className="px-6 pb-6 flex justify-end gap-2 pt-4 border-t border-border">
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-xl h-9 text-sm border-border bg-muted/30 hover:bg-muted/60"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            disabled={isDeleting}
            className="rounded-xl h-9 text-sm bg-destructive hover:bg-destructive/90 text-white min-w-24 gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})