"use client"

import React, { useState, ChangeEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Utensils, X, Plus, Copy, Trash2, Loader2 } from "lucide-react"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useCreateMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-create-menu-items"
import { CreateMenuItems, CreateMenuItemType } from "@/utils/types/food-category.types"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface MenuItemForm {
  name: string
  description: string
  price: string
  display_order: number
  is_available: boolean
  imagePreview: string | null
  imageUrl: string | null
  imageFile: File | null
  isUploading: boolean
  uploadError: string | null
  id: string
  uploadedAt?: number
}

interface AddMenuItemsProps {
  slug: string
  /** compact=true renders only the trigger button + dialog (no outer card wrapper).
   *  Use this when embedding the button inside another layout element like a hero header. */
  compact?: boolean
}

const getStorageKeys = (slug: string) => ({
  menuItems: `menu_items_draft_${slug}`,
  imageUrls: `uploaded_image_urls_${slug}`,
})

export default function AddMenuItems({ slug, compact = false }: AddMenuItemsProps) {
  const [open, setOpen] = useState(false)
  const { startUpload } = useUploadThing("imageUploader")
  const storageKeys = getStorageKeys(slug)

  const [menuItems, setMenuItems] = useState<MenuItemForm[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<Set<string>>(new Set())

  const { mutate: create_menu_items, isPending: creatingMenu } = useCreateMenuItems()
  const queryClient = useQueryClient()

  // ── Restore drafts ────────────────────────────────────────────────────
  useEffect(() => {
    const savedItems = localStorage.getItem(storageKeys.menuItems)
    const savedImageUrls = localStorage.getItem(storageKeys.imageUrls)
    if (savedImageUrls) {
      try { setUploadedImageUrls(new Set(JSON.parse(savedImageUrls))) } catch {}
    }
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems)
        const restored = parsed.map((item: any) => ({
          ...item, imageFile: null, isUploading: false, uploadError: null,
        }))
        setMenuItems(restored)
        setDraftCount(restored.filter((i: MenuItemForm) => i.name.trim() || i.price || i.imageUrl).length)
      } catch {
        localStorage.removeItem(storageKeys.menuItems)
        resetToEmptyMenu()
      }
    } else {
      resetToEmptyMenu()
      setUploadedImageUrls(new Set())
    }
    return () => { setMenuItems([]); setDraftCount(0) }
  }, [slug])

  // ── Cleanup orphaned images ───────────────────────────────────────────
  useEffect(() => {
    const cleanup = async () => {
      const savedItems = localStorage.getItem(storageKeys.menuItems)
      const savedImageUrls = localStorage.getItem(storageKeys.imageUrls)
      if (!savedImageUrls) return
      try {
        const allUrls = JSON.parse(savedImageUrls) as string[]
        const currentUrls = new Set<string>()
        if (savedItems) JSON.parse(savedItems).forEach((i: any) => { if (i.imageUrl) currentUrls.add(i.imageUrl) })
        const orphaned = allUrls.filter(u => !currentUrls.has(u))
        if (orphaned.length > 0) {
          await removeMultipleImages(orphaned)
          const remaining = allUrls.filter(u => currentUrls.has(u))
          localStorage.setItem(storageKeys.imageUrls, JSON.stringify(remaining))
          setUploadedImageUrls(new Set(remaining))
        }
      } catch {}
    }
    cleanup()
  }, [slug])

  // ── Persist drafts ────────────────────────────────────────────────────
  useEffect(() => {
    if (menuItems.length > 0 && !menuItems.some(i => i.isUploading)) {
      const toSave = menuItems.map(({ imageFile, ...rest }) => rest)
      localStorage.setItem(storageKeys.menuItems, JSON.stringify(toSave))
      setDraftCount(menuItems.filter(i => i.name.trim() || i.price || i.imageUrl).length)
    }
  }, [menuItems, storageKeys.menuItems])

  useEffect(() => {
    if (uploadedImageUrls.size > 0)
      localStorage.setItem(storageKeys.imageUrls, JSON.stringify(Array.from(uploadedImageUrls)))
  }, [uploadedImageUrls, storageKeys.imageUrls])

  // ── Helpers ───────────────────────────────────────────────────────────
  const getEmptyItem = (): MenuItemForm => ({
    id: crypto.randomUUID(), name: "", description: "", price: "",
    display_order: 0, is_available: true, imagePreview: null, imageUrl: null,
    imageFile: null, isUploading: false, uploadError: null,
  })

  const resetToEmptyMenu = () => setMenuItems([getEmptyItem()])

  const clearDraft = async () => {
    const urls = Array.from(uploadedImageUrls)
    localStorage.removeItem(storageKeys.menuItems)
    localStorage.removeItem(storageKeys.imageUrls)
    if (urls.length > 0) await removeMultipleImages(urls)
    setUploadedImageUrls(new Set())
    setDraftCount(0)
  }

  const clearAllDrafts = async () => {
    await clearDraft(); resetToEmptyMenu(); toast.success("Draft cleared")
  }

  const openDialog = () => {
    setOpen(true)
    const saved = localStorage.getItem(storageKeys.menuItems)
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((i: any) => ({ ...i, imageFile: null, isUploading: false, uploadError: null }))
        setMenuItems(parsed.length > 0 ? parsed : [getEmptyItem()])
      } catch { resetToEmptyMenu() }
    } else { resetToEmptyMenu() }
  }

  const isValidPrice = (p: string) => { const n = Number(p); return !!p && !isNaN(n) && n > 0 }
  const isValidItem = (item: MenuItemForm) => item.name.trim() && isValidPrice(item.price) && !item.isUploading

  const handlePriceChange = (id: string, value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "")
    const parts = cleaned.split(".")
    if (parts.length > 2 || parts[1]?.length > 2) return
    if (cleaned.length > 1 && cleaned[0] === "0" && cleaned[1] !== ".") { updateItem(id, "price", cleaned.slice(1)); return }
    updateItem(id, "price", cleaned)
  }

  const updateItem = (id: string, field: keyof MenuItemForm, value: any) =>
    setMenuItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))

  const uploadImage = async (file: File, id: string) => {
    try {
      updateItem(id, "isUploading", true)
      const res = await startUpload([file])
      if (res?.[0]?.ufsUrl) {
        const url = res[0].ufsUrl
        setUploadedImageUrls(prev => new Set(prev).add(url))
        setMenuItems(prev => prev.map(i => i.id === id
          ? { ...i, imageUrl: url, imageFile: null, isUploading: false, uploadError: null, uploadedAt: Date.now() } : i))
        toast.success("Image uploaded")
      } else throw new Error()
    } catch {
      setMenuItems(prev => prev.map(i => i.id === id
        ? { ...i, isUploading: false, uploadError: "Failed", imagePreview: null, imageFile: null, imageUrl: null } : i))
      toast.error("Failed to upload image")
    }
  }

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setMenuItems(prev => prev.map(i => i.id === id ? { ...i, imageFile: file, imagePreview: reader.result as string } : i))
      uploadImage(file, id)
    }
    reader.readAsDataURL(file)
  }

  const clearImage = async (id: string) => {
    const item = menuItems.find(i => i.id === id)
    const url = item?.imageUrl
    setMenuItems(prev => prev.map(i => i.id === id
      ? { ...i, imagePreview: null, imageUrl: null, imageFile: null, isUploading: false, uploadError: null } : i))
    if (url) {
      setUploadedImageUrls(prev => { const s = new Set(prev); s.delete(url); return s })
      await removeMultipleImages([url])
    }
    setTimeout(() => {
      const toSave = menuItems.map(({ imageFile, ...r }) => r)
      localStorage.setItem(storageKeys.menuItems, JSON.stringify(toSave))
    }, 0)
  }

  const addItem = () => {
    if (menuItems.length < 10) setMenuItems(prev => [...prev, getEmptyItem()])
  }

  const duplicateItem = (id: string) => {
    if (menuItems.length < 10) {
      const src = menuItems.find(i => i.id === id)
      if (src) setMenuItems(prev => [...prev, { ...src, id: crypto.randomUUID(), name: `${src.name} (Copy)`, imageFile: null, isUploading: false, uploadError: null }])
    }
  }

  const removeItem = async (id: string) => {
    const item = menuItems.find(i => i.id === id)
    const url = item?.imageUrl
    if (menuItems.length > 1) {
      setMenuItems(prev => {
        const filtered = prev.filter(i => i.id !== id)
        if (url) {
          setUploadedImageUrls(p => { const s = new Set(p); s.delete(url); return s })
          removeMultipleImages([url]).catch(console.error)
        }
        localStorage.setItem(storageKeys.menuItems, JSON.stringify(filtered.map(({ imageFile, ...r }) => r)))
        return filtered
      })
    }
  }

  const handleSubmit = async () => {
    if (creatingMenu) { toast.error("Please wait…"); return }
    if (!slug) { toast.error("Invalid slug"); return }
    if (menuItems.some(i => i.isUploading)) { toast.error("Wait for uploads"); return }
    const valid = menuItems.filter(i => i.name.trim() && isValidPrice(i.price))
    if (valid.length === 0) { toast.error("Add at least one valid item"); return }

    const payload: CreateMenuItems = {
      category_slug: slug,
      menu_items: valid.map((i): CreateMenuItemType => ({
        name: i.name.trim(), description: i.description || "",
        price: Number(Number(i.price).toFixed(2)),
        is_available: i.is_available, image_url: i.imageUrl || null,
        display_order: i.display_order,
      })),
    }

    create_menu_items(payload, {
      onSuccess: async (res) => {
        if (res.message && res.success) {
          queryClient.invalidateQueries({ queryKey: ["get-all-by-slug", slug] })
          toast.success(res.message)
          setOpen(false)
          localStorage.removeItem(storageKeys.menuItems)
          localStorage.removeItem(storageKeys.imageUrls)
          setUploadedImageUrls(new Set())
          setDraftCount(0)
          resetToEmptyMenu()
        }
      },
      onError: (err) => toast.error(err.message || "Failed to create items"),
    })
  }

  // ── Shared: trigger button ─────────────────────────────────────────────
  const triggerBtn = (
    <div className="flex items-center gap-2">
      {draftCount > 0 && !open && (
        <Button onClick={clearAllDrafts} variant="ghost" size="sm"
          className="rounded-xl h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer">
          Clear Draft ({draftCount})
        </Button>
      )}
      <Button onClick={openDialog} className="rounded-xl h-9 gap-2 text-sm cursor-pointer">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Menu Items</span>
        <span className="sm:hidden">Add</span>
        {draftCount > 0 && !open && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-medium">
            {draftCount}
          </span>
        )}
      </Button>
    </div>
  )

  // ── Shared: full dialog ────────────────────────────────────────────────
  const dialogEl = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <DialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Utensils className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                  Create Menu Items
                  <span className="ml-2 text-xs font-normal text-muted-foreground">({menuItems.length}/10)</span>
                </DialogTitle>
                {draftCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {draftCount} draft{draftCount > 1 ? "s" : ""} saved
                  </p>
                )}
              </div>
            </div>
            {menuItems.length > 0 && (
              <Button onClick={clearAllDrafts} variant="ghost" size="sm"
                className="h-7 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          <div className="max-h-[56vh] space-y-4 overflow-y-auto pr-1">
            {menuItems.map((item, index) => {
              const priceError = item.price && !isValidPrice(item.price)
              return (
                <div key={item.id} className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold flex items-center justify-center">{index + 1}</span>
                      <span className="text-xs font-medium text-foreground">Menu Item</span>
                      {!isValidItem(item) && <span className="text-[10px] text-destructive">*Required</span>}
                      {priceError && <span className="text-[10px] text-destructive">Invalid price</span>}
                      {item.uploadError && <span className="text-[10px] text-destructive">Upload failed</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => duplicateItem(item.id)} disabled={menuItems.length >= 10 || item.isUploading}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer" title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {menuItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.id)} disabled={item.isUploading}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <label htmlFor={`img-${item.id}`}
                        className={`relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-accent/60 hover:bg-accent/5 ${item.isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                        {item.isUploading ? (
                          <div className="flex flex-col items-center gap-1">
                            <Loader2 className="h-5 w-5 animate-spin text-accent" />
                            <span className="text-[9px] text-muted-foreground">Uploading…</span>
                          </div>
                        ) : item.imagePreview ? (
                          <>
                            <img src={item.imagePreview} alt="preview" className="h-full w-full rounded-xl object-cover" />
                            <button type="button" onClick={(e) => { e.preventDefault(); clearImage(item.id) }}
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90 cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">Upload</span>
                          </div>
                        )}
                      </label>
                      <input id={`img-${item.id}`} type="file" accept="image/*" hidden disabled={item.isUploading} onChange={(e) => handleImageChange(e, item.id)} />
                    </div>
                    <div className="flex-1 text-[10px] text-muted-foreground">
                      {item.imageUrl ? <p className="text-emerald-600">✓ Uploaded</p>
                        : item.uploadError ? <p className="text-destructive">Failed. Click to retry.</p>
                        : <p>PNG, JPG up to 5MB · Auto-uploads on select</p>}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Name <span className="text-destructive">*</span></Label>
                      <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        className="h-9 text-sm bg-background border-border rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Price <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rs</span>
                        <Input type="text" inputMode="decimal" placeholder="0.00" value={item.price}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          className={`h-9 text-sm bg-background border-border rounded-xl pl-8 ${priceError ? "border-destructive" : ""}`} />
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                      <Textarea placeholder="Describe your menu item…" value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="min-h-14 resize-none text-sm bg-background border-border rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Display Order</Label>
                      <Input type="number" placeholder="0" value={item.display_order}
                        onChange={(e) => updateItem(item.id, "display_order", Number(e.target.value))}
                        className="h-9 text-sm bg-background border-border rounded-xl" min="0" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border px-3 py-2.5">
                      <Checkbox id={`avail-${item.id}`} checked={item.is_available}
                        onCheckedChange={(checked) => updateItem(item.id, "is_available", Boolean(checked))} />
                      <Label htmlFor={`avail-${item.id}`} className="cursor-pointer text-xs font-medium text-foreground">Available</Label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {menuItems.length < 10 && (
            <Button type="button" variant="outline" onClick={addItem} disabled={menuItems.some(i => i.isUploading)}
              className="w-full rounded-xl h-9 gap-2 text-sm border-dashed border-border hover:border-accent/40 hover:bg-accent/5 cursor-pointer">
              <Plus className="h-4 w-4" />
              Add Another Item ({menuItems.length}/10)
            </Button>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ready to add</span>
              <span className="font-medium text-foreground">{menuItems.filter(isValidItem).length} valid item(s)</span>
            </div>
            {menuItems.some(i => i.isUploading) && (
              <p className="text-xs text-amber-500">⏳ Waiting for uploads…</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={menuItems.some(i => i.isUploading)}
                className="flex-1 rounded-xl h-9 text-sm border-border cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!menuItems.some(isValidItem) || menuItems.some(i => i.isUploading) || creatingMenu}
                className="flex-1 rounded-xl h-9 text-sm min-w-28 gap-2 cursor-pointer">
                {creatingMenu ? (
                  <><span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Creating…</>
                ) : menuItems.some(i => i.isUploading) ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Uploading…</>
                ) : (
                  `Add ${menuItems.filter(isValidItem).length} Item(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // ── compact=true → only button + floating dialog ──────────────────────
  if (compact) {
    return <>{triggerBtn}{dialogEl}</>
  }

  // ── compact=false (default) → full card wrapper ───────────────────────
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Utensils className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Manage Menu Items</h2>
            <p className="text-xs text-muted-foreground">Add new menu items to this category</p>
          </div>
        </div>
        {triggerBtn}
      </div>
      {dialogEl}
    </div>
  )
}