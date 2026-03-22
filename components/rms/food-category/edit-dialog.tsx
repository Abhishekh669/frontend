'use client'

import { memo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'
import { X, FolderOpen, UtensilsCrossed } from 'lucide-react'
import { Category, MenuItem, UpdateMenuItemType } from '@/utils/types/food-category.types'
import { toast } from 'sonner'

// ── Local interface to avoid 'display_order does not exist' TS error
// The shared UpdateCategoryType may not include display_order depending on your types file
interface UpdateCategoryLocal {
  id: string
  name: string
  is_active: boolean
  display_order: number
}

interface EditCategoryDialogProps {
  category: Category | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: UpdateCategoryLocal) => Promise<void>
  isSaving: boolean
}

interface EditMenuItemDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: UpdateMenuItemType, imageFile?: File) => Promise<void>
  isSaving: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Category Dialog
// ─────────────────────────────────────────────────────────────────────────────
export const EditCategoryDialog = memo(function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditCategoryDialogProps) {
    const [formData, setFormData] = useState<UpdateCategoryType>({
        id: '',
        name: '',
        is_active: true,
    });

    useEffect(() => {
        if (category) {
            setFormData({
                id: category.id,
                name: category.name,
                is_active: category.is_active,
            });
        }
    }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSaving) return
    e.preventDefault()
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Failed to save category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (isSaving) return
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden"
        onInteractOutside={(e) => { if (isSaving) e.preventDefault() }}
      >
        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <FolderOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Edit Category
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update name, order, and visibility status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Category Name
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                placeholder="e.g. Beverages"
                required
                disabled={isSaving}
              />
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Display Order
              </Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
            }}>
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>
                        Make changes to the category here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is_active" className="text-right">
                                Active
                            </Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_active: checked as boolean })
                                    }
                                    disabled={isSaving}
                                />
                                <Label htmlFor="is_active">Category is active</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
});

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Category visible to customers</p>
              </div>
              <Switch
                id="is_active_cat"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={isSaving}
              />
            </div>

          </div>

          <DialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl h-9 text-sm border-border bg-muted/30 hover:bg-muted/60 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl h-9 text-sm min-w-28 gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Edit Menu Item Dialog
// ─────────────────────────────────────────────────────────────────────────────
export const EditMenuItemDialog = memo(function EditMenuItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditMenuItemDialogProps) {
  const [formData, setFormData] = useState<UpdateMenuItemType>({
    id: '',
    name: '',
    description: '',
    price: 0,
    is_available: true,
    image_url: '',
    display_order: 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price as any),
        is_available: item.is_available,
        image_url: item.image_url || '',
        display_order: item.display_order,
      })
      setPreviewUrl(item.image_url || null)
    }
  }, [item])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSaving) return
    e.preventDefault()
    try {
      await onSave(formData, imageFile || undefined)
      handleRemoveImage()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (isSaving) return
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden"
        onInteractOutside={(e) => { if (isSaving) e.preventDefault() }}
      >
        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Edit Menu Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update details, pricing, and availability.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh]">
            <div className="px-6 py-5 space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Name
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                  placeholder="e.g. Margherita Pizza"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors resize-none"
                  placeholder="Short description of the item..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>

              {/* Price + Order row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Price (Rs)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Display Order
                  </Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                    }
                    className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Available toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">Available</p>
                  <p className="text-xs text-muted-foreground">Visible on the menu</p>
                </div>
                <Switch
                  id="is_available_edit"
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_available: checked })
                  }
                  disabled={isSaving}
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Image
                </Label>
                {previewUrl && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border group">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isSaving}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="h-9 text-sm bg-muted/30 border-border rounded-xl cursor-pointer"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current image.
                </p>
              </div>

            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl h-9 text-sm border-border bg-muted/30 hover:bg-muted/60 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl h-9 text-sm min-w-28 gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})