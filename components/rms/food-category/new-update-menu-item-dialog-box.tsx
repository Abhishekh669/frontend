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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { X, Utensils, Upload, ImageIcon } from 'lucide-react'
import { MenuItem, UpdateMenuItemType } from '@/utils/types/food-category.types'

interface EditMenuItemDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // No 3rd arg — removal is encoded as image_url: null inside data
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
  const [imageRemoved, setImageRemoved] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price as any),
        is_available: item.is_available,
        image_url: item.image_url || '',   // ← keep original URL untouched throughout
        display_order: item.display_order,
      })
      setPreviewUrl(item.image_url || null)
      setImageRemoved(false)
      setImageFile(null)
    }
  }, [item])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImageRemoved(false)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      setImageRemoved(false)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewUrl(null)
    setImageRemoved(true)
    // NEVER touch formData.image_url here — parent needs it to delete the correct uploadthing file
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    // Encode removal intent directly in image_url:
    //   null  → user removed image, no new file → parent deletes old + saves null
    //   url   → keep existing OR parent will replace after uploading imageFile
    const resolvedImageUrl: string | null =
      imageRemoved && !imageFile ? null : formData.image_url || null

    const submitData: UpdateMenuItemType = {
      ...formData,
      image_url: resolvedImageUrl as any,
    }

    await onSave(submitData, imageFile ?? undefined)
    resetState()
  }

  const resetState = () => {
    setImageFile(null)
    setPreviewUrl(null)
    setImageRemoved(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (isSaving) return
    if (!newOpen) resetState()
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/*
        Key layout rules:
        - DialogContent is a flex column capped at 90vh
        - Header: shrink-0 (never scrolls)
        - form: flex-1 flex-col min-h-0 (fills remaining space)
          - scrollable area: flex-1 overflow-y-auto min-h-0
          - footer: shrink-0 (always visible at bottom)
      */}
      <DialogContent
        className="sm:max-w-2xl w-[95vw] max-h-[90vh] rounded-2xl border-0 bg-card p-0 shadow-2xl overflow-hidden flex flex-col"
        onInteractOutside={(e) => { if (isSaving) e.preventDefault() }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent to-primary z-10 shrink-0 pointer-events-none" />

        {/* ── HEADER — never scrolls ──────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground">
                Edit Menu Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Update the details below to modify your menu item
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── FORM — flex column that fills remaining height ─────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

          {/* ── SCROLLABLE CONTENT ──────────────────────────────────────── */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-3.5 rounded-full bg-primary inline-block" />
                Name <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-sm bg-muted/30 border-border/60 rounded-xl focus:bg-background focus:border-primary/50 transition-colors"
                placeholder="Enter item name"
                required
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-3.5 rounded-full bg-primary inline-block" />
                Description
              </Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-sm bg-muted/30 border-border/60 rounded-xl focus:bg-background focus:border-primary/50 transition-colors resize-none"
                rows={3}
                placeholder="Describe your menu item…"
                disabled={isSaving}
              />
            </div>

            {/* Price + Display Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1 h-3.5 rounded-full bg-primary inline-block" />
                  Price (Rs) <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  type="number" step="0.01" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="h-10 text-sm bg-muted/30 border-border/60 rounded-xl focus:bg-background focus:border-primary/50 transition-colors"
                  placeholder="0.00" required disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1 h-3.5 rounded-full bg-primary inline-block" />
                  Display Order
                </Label>
                <Input
                  type="number" value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="h-10 text-sm bg-muted/30 border-border/60 rounded-xl focus:bg-background focus:border-primary/50 transition-colors"
                  placeholder="0" disabled={isSaving}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60">
              <Checkbox
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(c) => setFormData({ ...formData, is_available: c as boolean })}
                disabled={isSaving}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="is_available" className="text-sm font-medium cursor-pointer">
                  Available for ordering
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Item will be visible and orderable by customers
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-3.5 rounded-full bg-primary inline-block" />
                Item Image
              </Label>

              {previewUrl && !imageRemoved ? (
                /* ── Current / new image preview ── */
                <div className="relative group rounded-xl overflow-hidden border border-border/60 shadow-sm">
                  {/* Fixed height — never tall enough to push footer off screen */}
                  <div className="relative w-full h-44">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-lg shadow-lg gap-1.5"
                      onClick={handleRemoveImage}
                      disabled={isSaving}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove Image
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Drop zone ── */
                <div
                  className={`
                    relative border-2 border-dashed rounded-xl p-7 text-center
                    transition-all duration-200 cursor-pointer select-none
                    ${isDragging
                      ? 'border-primary bg-primary/5 scale-[0.99]'
                      : 'border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
                    }
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-upload-edit')?.click()}
                >
                  <input
                    id="image-upload-edit"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSaving}
                  />
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
                      {imageRemoved
                        ? <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        : <Upload className="h-6 w-6 text-primary" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {imageRemoved
                          ? 'No image — click or drag to add one'
                          : isDragging
                            ? 'Drop your image here'
                            : 'Click or drag to upload'
                        }
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, GIF up to 5 MB</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                {imageRemoved && !imageFile
                  ? '⚠ Image will be removed on save.'
                  : previewUrl && !imageFile
                    ? 'Current image shown. Hover to remove.'
                    : imageFile
                      ? 'New image selected — will be uploaded on save.'
                      : 'Upload a high-quality image for better presentation.'
                }
              </p>
            </div>

          </div>{/* end scrollable content */}

          {/* ── FOOTER — always sticks to bottom ────────────────────────── */}
          <div className="shrink-0 px-6 pt-4 pb-5 border-t border-border/50 bg-card flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              className="h-9 px-5 rounded-xl border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-9 px-6 rounded-xl min-w-[120px] bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm transition-all"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
})