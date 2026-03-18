"use client"

import { useState, useMemo } from "react"
import { MenuItemsResponse, MenuItem, UpdateMenuItemType } from "@/utils/types/food-category.types"
import { MenuItemDeleteDialog } from "./delete-dialog-box"
import { EditMenuItemDialog } from "./edit-dialog"
import { useUpdateMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-menu-items"
import { useDeleteMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-menu-items"
import { useQueryClient } from "@tanstack/react-query"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

type Props = {
  menuItems: MenuItemsResponse[]
  slugs: string
}

function NewMenuItemsPage({ menuItems, slugs }: Props) {
  const queryClient = useQueryClient()
  const { startUpload } = useUploadThing("imageUploader")

  const [selected, setSelected] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<MenuItem[]>([])

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)

  const { mutate: update_menu_item, isPending: updating_menu_item } = useUpdateMenuItems()
  const { mutate: delete_menu_items, isPending: deleting_menu_items } = useDeleteMenuItems()

  const isSaving = uploadingImage || updating_menu_item

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selected.length === menuItems.length) {
      setSelected([])
    } else {
      setSelected(menuItems.map((item) => item.id))
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openBulkDeleteDialog = () => {
    const selectedItems = menuItems
      .filter((item) => selected.includes(item.id))
      .map((item) => item as unknown as MenuItem)
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
        console.error("Failed to delete menu items:", error)
        toast.error(error.message || "Failed to delete menu items")
      }
    })
  }

  // ── Edit / Update ──────────────────────────────────────────────────────────

  const openEditDialog = (item: MenuItemsResponse) => {
    setItemToEdit(item as unknown as MenuItem)
    setEditDialogOpen(true)
  }

  const handleSaveMenuItem = async (data: UpdateMenuItemType, imageFile?: File) => {
    try {
      setUploadingImage(true)

      let updatedImage: string | null = data.image_url || null

      // User removed the existing image
      if (!imageFile && !data.image_url && itemToEdit?.image_url) {
        await removeMultipleImages([itemToEdit.image_url])
        updatedImage = null
      }

      // New image file provided — upload it
      if (imageFile) {
        const uploadResults = await startUpload([imageFile])
        if (uploadResults && uploadResults.length > 0) {
          updatedImage = uploadResults[0].ufsUrl

          // Delete old image if it existed and is different
          if (data.image_url && data.image_url !== updatedImage) {
            await removeMultipleImages([data.image_url])
          }
        } else {
          throw new Error("Failed to upload image")
        }
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
          console.error("Failed to update menu item:", error)
          toast.error(error.message || "Failed to update menu item")
          setUploadingImage(false)
        }
      })
    } catch (error) {
      console.error("Failed to update menu item:", error)
      toast.error("Failed to upload image or update menu item")
      setUploadingImage(false)
      throw error
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Menu Items</h1>
          {selected.length > 0 && (
            <p className="text-sm text-primary font-medium">{selected.length} selected</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <>
              <Badge variant="secondary" className="px-3 py-1">
                {selected.length} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={openBulkDeleteDialog}
                disabled={deleting_menu_items}
                className="gap-2"
              >
                {deleting_menu_items ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  onChange={selectAll}
                  checked={menuItems.length > 0 && selected.length === menuItems.length}
                  disabled={deleting_menu_items || isSaving}
                />
              </th>
              <th className="p-3 text-left">Image</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Available</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {menuItems?.map((item) => (
              <tr
                key={item.id}
                className={`border-t ${deleting_menu_items || isSaving ? "opacity-60 pointer-events-none" : ""}`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                </td>

                <td className="p-3">
                  {item.image_url ? (
                    <div className="relative w-12 h-12">
                      <Image
                        src={item.image_url}
                        alt={item.name || "image"}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                </td>

                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.category_name}</td>
                <td className="p-3">Rs {item.price}</td>

                <td className="p-3">
                  {item.is_available ? (
                    <span className="text-green-600 font-medium">Available</span>
                  ) : (
                    <span className="text-red-500 font-medium">Not Available</span>
                  )}
                </td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => openEditDialog(item)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => openSingleDeleteDialog(item)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Dialog */}
      <MenuItemDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        items={itemsToDelete}
        isDeleting={deleting_menu_items}
      />

      {/* Edit Dialog */}
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