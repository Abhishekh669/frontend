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
import { Trash2, Pencil, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { EditMenuItemDialog } from "./new-update-menu-item-dialog-box"

type Props = {
  menuItems: MenuItemsResponse[]
  slugs: string
}

function NewMenuItemsPage({ menuItems, slugs }: Props) {
  const queryClient = useQueryClient()
  const { startUpload } = useUploadThing("imageUploader")

  const [selected, setSelected] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<MenuItem[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)

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

  const handleSaveMenuItem = async (
    data: UpdateMenuItemType,
    imageFile?: File,
    imageRemoved?: boolean
  ) => {
    try {
      setUploadingImage(true)
      let updatedImageUrl: string | null = data.image_url || null

      // Case 1: User explicitly removed the image and didn't add a new one
      if (imageRemoved && !imageFile) {
        // Delete the old image from uploadthing if it exists
        if (itemToEdit?.image_url) {
          await removeMultipleImages([itemToEdit.image_url])
        }
        updatedImageUrl = null // ✅ Send null to backend
      }
      // Case 2: User selected a new image — upload it and delete the old one
      else if (imageFile) {
        const uploadResults = await startUpload([imageFile])
        if (uploadResults?.length) {
          const newUrl = uploadResults[0].ufsUrl
          // Delete old image from uploadthing if it existed
          if (itemToEdit?.image_url) {
            await removeMultipleImages([itemToEdit.image_url])
          }
          updatedImageUrl = newUrl
        } else {
          throw new Error("Failed to upload image")
        }
      }
      // Case 3: No change to image — keep original image_url
      // updatedImageUrl already has the original value

      const updatedData: UpdateMenuItemType = { 
        ...data, 
        image_url: updatedImageUrl 
      }
      
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

              {/* Select-all checkbox — leftmost column in header */}
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

              {/* Actions column — shows bulk delete when items selected */}
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
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Actions
                  </span>
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
                  className={`hover:bg-muted/20 transition-colors ${
                    selected.includes(item.id) ? 'bg-accent/5' : ''
                  } ${deleting_menu_items || isSaving ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                      checked={selected.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>

                  <td className="px-4 py-3">
                    {item.image_url ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-border shrink-0">
                        <Image src={item.image_url} alt={item.name || "image"} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
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

                  <td className="px-4 py-3">
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