'use client'

import { memo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { X, Utensils } from 'lucide-react'
import { MenuItem, UpdateMenuItemType } from '@/utils/types/food-category.types'

interface EditMenuItemDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: UpdateMenuItemType, imageFile?: File) => Promise<void>
  isSaving: boolean
}

export const EditMenuItemDialog = memo(function EditMenuItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditMenuItemDialogProps) {
  const [formData, setFormData] = useState<UpdateMenuItemType>({
    id: '', name: '', description: '', price: 0, is_available: true, image_url: '', display_order: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSaving) return
    e.preventDefault()
    try {
      await onSave(formData, imageFile || undefined)
      handleRemoveImage()
    } catch {}
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewUrl(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (isSaving) return
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden"
        onInteractOutside={(e) => { if (isSaving) e.preventDefault() }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <DialogHeader className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Utensils className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Edit Menu Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Make changes below. Click save when you're done.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[55vh]">
            <div className="px-6 py-5 space-y-4">

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm bg-muted/30 border-border rounded-xl focus:bg-background transition-colors"
                  required disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-sm bg-muted/30 border-border rounded-xl focus:bg-background transition-colors resize-none"
                  rows={3} disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Price (Rs) *</Label>
                  <Input
                    type="number" step="0.01" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="h-9 text-sm bg-muted/30 border-border rounded-xl focus:bg-background transition-colors"
                    required disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Display Order</Label>
                  <Input
                    type="number" value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm bg-muted/30 border-border rounded-xl focus:bg-background transition-colors"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/30 border border-border">
                <Checkbox
                  id="is_available" checked={formData.is_available}
                  onCheckedChange={(c) => setFormData({ ...formData, is_available: c as boolean })}
                  disabled={isSaving}
                />
                <div>
                  <Label htmlFor="is_available" className="text-sm font-medium cursor-pointer">Available</Label>
                  <p className="text-[11px] text-muted-foreground">Item will be visible to customers</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Image</Label>
                {previewUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    <Button type="button" variant="destructive" size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-lg"
                      onClick={handleRemoveImage} disabled={isSaving}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handleImageChange}
                  className="h-9 text-sm bg-muted/30 border-border rounded-xl" disabled={isSaving} />
                <p className="text-[11px] text-muted-foreground">
                  Leave empty to keep current image. New image replaces the old one.
                </p>
              </div>

            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
              disabled={isSaving} className="h-9 px-4 rounded-xl border-border text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}
              className="h-9 px-4 rounded-xl min-w-[100px] bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})