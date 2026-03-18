"use client"

import { useState } from "react"
import { MenuItemsResponse, MenuItem, UpdateMenuItemType } from "@/utils/types/food-category.types"
import { MenuItemDeleteDialog } from "./delete-dialog-box"
import { EditMenuItemDialog } from "./edit-dialog"
import Image from "next/image"

type Props = {
  menuItems: MenuItemsResponse[]
}

function NewMenuItemsPage({ menuItems }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<MenuItem[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  // Bulk delete — opens dialog with all selected items
  const openBulkDeleteDialog = () => {
    const selectedItems = menuItems
      .filter((item) => selected.includes(item.id))
      .map((item) => item as unknown as MenuItem)
    setItemsToDelete(selectedItems)
    setDeleteDialogOpen(true)
  }

  // Single delete — opens dialog with just that item
  const openSingleDeleteDialog = (item: MenuItemsResponse) => {
    setItemsToDelete([item as unknown as MenuItem])
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      console.log("Deleting items:", itemsToDelete.map((i) => i.id))
      // TODO: wire up your real delete mutation here
      setSelected([])
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (item: MenuItemsResponse) => {
    setItemToEdit(item as unknown as MenuItem)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async (data: UpdateMenuItemType, imageFile?: File) => {
    setIsSaving(true)
    try {
      console.log("Saving item:", data, imageFile)
      // TODO: wire up your real update mutation here
      setEditDialogOpen(false)
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Menu Items</h1>

        <button
          onClick={openBulkDeleteDialog}
          disabled={selected.length === 0}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete Selected {selected.length > 0 && `(${selected.length})`}
        </button>
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
              <tr key={item.id} className="border-t">

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
        onConfirm={handleConfirmDelete}
        items={itemsToDelete}
        isDeleting={isDeleting}
      />

      {/* Edit Dialog */}
      <EditMenuItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        item={itemToEdit}
        isSaving={isSaving}
      />

    </div>
  )
}

export default NewMenuItemsPage