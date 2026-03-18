"use client"

import { useState, useMemo } from "react"
import { useGetAllMenuItems } from "@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-menu-item"
import {
  MenuItemsResponse,
  MenuItem,
  MenuItemWithCategory,
  UpdateMenuItemType
} from "@/utils/types/food-category.types"
import { useUpdateMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-menu-items"
import { useDeleteMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-menu-items"
import { useQueryClient } from "@tanstack/react-query"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EditMenuItemDialog } from "./new-update-menu-item-dialog-box"
import { MenuItemDeleteDialog } from "./delete-dialog-box"
import Image from "next/image"

function NewAllMenuItemsGrouped() {
  // ── Hooks (all at top) ───────────────────────────────
  const { data, isLoading } = useGetAllMenuItems()
  const grouped_menu = data?.grouped_menu
  const queryClient = useQueryClient()
  const { startUpload } = useUploadThing("imageUploader")

  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selected, setSelected] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<MenuItemWithCategory[]>([])

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItemWithCategory | null>(null)

  const { mutate: update_menu_item, isPending: updating_menu_item } = useUpdateMenuItems()
  const { mutate: delete_menu_items, isPending: deleting_menu_items } = useDeleteMenuItems()
  const isSaving = uploadingImage || updating_menu_item

  // ── Data processing ───────────────────────────────
  const categories = useMemo(() => (grouped_menu ? Object.values(grouped_menu) : []), [grouped_menu])

  const menuItems: MenuItemWithCategory[] = useMemo(() => {
    if (!grouped_menu) return []

    let items: MenuItemsResponse[] = []
    if (selectedCategory === "all") {
      categories.forEach((cat) => items.push(...cat.menu_items))
    } else {
      items = grouped_menu[selectedCategory]?.menu_items || []
    }

    return items.map((item) => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
    })) as MenuItemWithCategory[]
  }, [grouped_menu, selectedCategory, categories])

  // ── Selection ───────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selected.length === menuItems.length) setSelected([])
    else setSelected(menuItems.map((item) => item.id))
  }

  // ── Delete ───────────────────────────────
  const openBulkDeleteDialog = () => {
    const selectedItems = menuItems.filter((item) => selected.includes(item.id))
    setItemsToDelete(selectedItems)
    setDeleteDialogOpen(true)
  }

  const openSingleDeleteDialog = (item: MenuItemWithCategory) => {
    setItemsToDelete([item])
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (itemsToDelete.length === 0 || deleting_menu_items) return
    const ids = itemsToDelete.map((i) => i.id)
    delete_menu_items(ids, {
      onSuccess: (res) => {
        if (res.success && res.message) {
          queryClient.invalidateQueries({ queryKey: ["get-all-menu-items"] })
          toast.success(res.message)
          setSelected([])
          setDeleteDialogOpen(false)
          setItemsToDelete([])
        }
      },
      onError: (error) => {
        console.error(error)
        toast.error(error.message || "Failed to delete menu items")
      }
    })
  }

  // ── Edit / Update ───────────────────────────────
  const openEditDialog = (item: MenuItemWithCategory) => {
    setItemToEdit(item)
    setEditDialogOpen(true)
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
          if (data.image_url && data.image_url !== updatedImage) {
            await removeMultipleImages([data.image_url])
          }
        } else throw new Error("Failed to upload image")
      }

      const updatedData: UpdateMenuItemType = { ...data, image_url: updatedImage }

      update_menu_item(updatedData, {
        onSuccess: (res) => {
          if (res.success && res.message) {
            queryClient.invalidateQueries({ queryKey: ["get-all-menu-items"] })
            toast.success(res.message)
            setEditDialogOpen(false)
            setItemToEdit(null)
          }
          setUploadingImage(false)
        },
        onError: (error) => {
          console.error(error)
          toast.error(error.message || "Failed to update menu item")
          setUploadingImage(false)
        }
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image or update menu item")
      setUploadingImage(false)
    }
  }

  // ── Conditional rendering ───────────────────────────────
  if (isLoading) return <div className="p-6">Loading menu items...</div>
  if (!grouped_menu) return <div className="p-6">No menu items found</div>

  // ── Render ───────────────────────────────
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Menu Items</h1>

        <select
          className="border px-3 py-2 rounded"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_slug} value={cat.category_slug}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={menuItems.length > 0 && selected.length === menuItems.length}
                  onChange={selectAll}
                  disabled={deleting_menu_items || isSaving}
                />
              </th>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Available</th>
              <th className="p-3">Order</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {menuItems.map((item) => (
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

                <td className="p-3 relative ">
                  import Image from "next/image";

                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name || "image"}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded"
                    />
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

                <td className="p-3">{item.display_order}</td>

                <td className="p-3 flex gap-2">
                  <Button
                    onClick={() => openEditDialog(item)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Update
                  </Button>
                  <Button
                    onClick={() => openSingleDeleteDialog(item)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </Button>
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

export default NewAllMenuItemsGrouped