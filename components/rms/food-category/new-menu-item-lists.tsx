"use client"

import { useState } from "react"
import { MenuItemsResponse, MenuItem, UpdateMenuItemType } from "@/utils/types/food-category.types"
import { MenuItemDeleteDialog } from "./delete-dialog-box"
import { useUpdateMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-menu-items"
import { useDeleteMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-menu-items"
import { useQueryClient } from "@tanstack/react-query"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { toast } from "sonner"
import { Trash2, Pencil, UtensilsCrossed, X, Tag, Hash, ToggleLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { EditMenuItemDialog } from "./new-update-menu-item-dialog-box"

type Props = {
  menuItems: MenuItemsResponse[]
  slugs: string
}

// ── Item Detail Dialog ──────────────────────────────────────────────────────
function ItemDetailDialog({
  item,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  item: MenuItemsResponse | null
  open: boolean
  onClose: () => void
  onEdit: (item: MenuItemsResponse) => void
  onDelete: (item: MenuItemsResponse) => void
}) {
  if (!open || !item) return null

  return (
    // Backdrop — click outside closes
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent z-10" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center bg-card/80 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Large image */}
        <div className="relative w-full h-56 bg-muted/40">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name || "dish"}
              fill
              className="object-cover"
              sizes="400px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {/* Status badge over image */}
          <div className="absolute bottom-3 left-3">
            {item.is_available ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/90 text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/90 text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Unavailable
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-4">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground leading-tight">{item.name}</h2>
            <span className="text-xl font-bold text-accent shrink-0">Rs {item.price}</span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {item.category_name && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                {item.category_name}
              </div>
            )}
            {item.display_order !== undefined && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                Order: {item.display_order}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onEdit(item); onClose() }}
              className="flex-1 rounded-xl h-9 gap-2 text-xs border-border hover:bg-muted/60"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { onDelete(item); onClose() }}
              className="flex-1 rounded-xl h-9 gap-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Table Component ────────────────────────────────────────────────────
function NewMenuItemsPage({ menuItems, slugs }: Props) {
  const queryClient = useQueryClient()
  const { startUpload } = useUploadThing("imageUploader")

  const [selected, setSelected] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<MenuItem[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)
  const [previewItem, setPreviewItem] = useState<MenuItemsResponse | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const { mutate: update_menu_item, isPending: updating_menu_item } = useUpdateMenuItems()
  const { mutate: delete_menu_items, isPending: deleting_menu_items } = useDeleteMenuItems()
  const isSaving = uploadingImage || updating_menu_item

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selected.length === menuItems.length) setSelected([])
    else setSelected(menuItems.map((item) => item.id))
  }

  const openBulkDeleteDialog = () => {
    const selectedItems = menuItems.filter((item) => selected.includes(item.id)).map((item) => item as unknown as MenuItem)
    setItemsToDelete(selectedItems)
    setDeleteDialogOpen(true)
  }

  const openSingleDeleteDialog = (item: MenuItemsResponse) => {
    setItemsToDelete([item as unknown as MenuItem])
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (itemsToDelete.length === 0 || deleting_menu_items) return
    const ids = itemsToDelete.map((i) => i.id)
    delete_menu_items(ids, {
      onSuccess: (res) => {
        if (res.message && res.success) {
          queryClient.invalidateQueries({ queryKey: ["get-all-by-slug", slugs] })
          toast.success(res.message)
          setSelected([])
          setDeleteDialogOpen(false)
          setItemsToDelete([])
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete menu items")
      }
    })
  }

  const openEditDialog = (item: MenuItemsResponse) => {
    setItemToEdit(item as unknown as MenuItem)
    setEditDialogOpen(true)
  }

  const openPreview = (item: MenuItemsResponse) => {
    setPreviewItem(item)
    setPreviewOpen(true)
  }

  const handleSaveMenuItem = async (data: UpdateMenuItemType, imageFile?: File) => {
    try {
      setUploadingImage(true)
      let updatedImage: string | null = data.image_url || null
      if (!imageFile && !data.image_url && itemToEdit?.image_url) {
        await removeMultipleImages([itemToEdit.image_url])
        updatedImage = null
      }
      if (imageFile) {
        const uploadResults = await startUpload([imageFile])
        if (uploadResults?.length) {
          updatedImage = uploadResults[0].ufsUrl
          if (data.image_url && data.image_url !== updatedImage) await removeMultipleImages([data.image_url])
        } else throw new Error("Failed to upload image")
      }
      const updatedData: UpdateMenuItemType = { ...data, image_url: updatedImage }
      update_menu_item(updatedData, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ["get-all-by-slug", slugs] })
            toast.success(res.message || "Menu item updated successfully")
            setEditDialogOpen(false)
            setItemToEdit(null)
          }
          setUploadingImage(false)
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update menu item")
          setUploadingImage(false)
        }
      })
    } catch (error) {
      toast.error("Failed to upload image or update menu item")
      setUploadingImage(false)
      throw error
    }
  }

  const allChecked = menuItems.length > 0 && selected.length === menuItems.length
  const someChecked = selected.length > 0 && selected.length < menuItems.length

  return (
    <div className="space-y-0">

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked }}
                  onChange={selectAll}
                  disabled={deleting_menu_items || isSaving}
                  title="Select all"
                />
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Image</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right">
                {selected.length > 0 ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={openBulkDeleteDialog}
                    disabled={deleting_menu_items}
                    className="rounded-xl h-7 text-xs gap-1.5"
                  >
                    {deleting_menu_items ? (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete ({selected.length})
                  </Button>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Actions</span>
                )}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {menuItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No menu items found</p>
                  </div>
                </td>
              </tr>
            ) : (
              menuItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openPreview(item)}
                  className={`hover:bg-muted/20 transition-colors cursor-pointer ${
                    selected.includes(item.id) ? 'bg-accent/5' : ''
                  } ${deleting_menu_items || isSaving ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {/* Checkbox — stop propagation so it doesn't open preview */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                      checked={selected.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>

                  {/* Bigger image: w-16 h-16 */}
                  <td className="px-4 py-2">
                    {item.image_url ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden ring-1 ring-border shrink-0">
                        <Image src={item.image_url} alt={item.name || "image"} fill className="object-cover" sizes="64px" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{item.category_name}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Rs {item.price}</span>
                  </td>

                  <td className="px-4 py-3">
                    {item.is_available ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Unavailable
                      </span>
                    )}
                  </td>

                  {/* Edit/Delete — stop propagation so they don't open preview */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditDialog(item)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openSingleDeleteDialog(item)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Item Detail Preview Dialog ───────────────────────────────── */}
      <ItemDetailDialog
        item={previewItem}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onEdit={openEditDialog}
        onDelete={openSingleDeleteDialog}
      />

      <MenuItemDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        items={itemsToDelete}
        isDeleting={deleting_menu_items}
      />
      <EditMenuItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveMenuItem}
        item={itemToEdit}
        isSaving={isSaving}
      />
    </div>
  )
}

export default NewMenuItemsPage