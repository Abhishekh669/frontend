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
import { X } from 'lucide-react'
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
  isSaving
}: EditMenuItemDialogProps) {
  const [formData, setFormData] = useState<UpdateMenuItemType>({
    id: '',
    name: '',
    description: '',
    price: 0,
    is_available: true,
    image_url: '',
    display_order: 0
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
        display_order: item.display_order
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
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
            Edit Menu Item
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Make changes to the menu item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh]">
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors resize-none"
                  rows={3}
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Price (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border px-3 py-2.5">
                <Checkbox
                  id="is_available_upd"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked as boolean })}
                  disabled={isSaving}
                />
                <Label htmlFor="is_available_upd" className="text-sm cursor-pointer text-foreground">
                  Item is available
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Image</Label>
                {previewUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border mb-2">
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isSaving}
                      className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="h-9 text-sm bg-muted/30 border-border rounded-xl"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep current image. New image will replace the old one.
                </p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl h-9 text-sm border-border bg-muted/30 hover:bg-muted/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl h-9 text-sm min-w-28 gap-2"
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