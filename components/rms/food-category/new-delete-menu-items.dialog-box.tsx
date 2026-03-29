"use client"

import { useState } from "react"
import { MenuItemsResponse, MenuItem, UpdateMenuItemType } from "@/utils/types/food-category.types"
import { MenuItemDeleteDialog } from "./delete-dialog-box"
import { Trash2, Pencil, UtensilsCrossed } from "lucide-react"
import Image from "next/image"
import { EditMenuItemDialog } from "./new-update-menu-item-dialog-box"

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
    if (selected.length === menuItems.length) setSelected([])
    else setSelected(menuItems.map((item) => item.id))
  }

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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary cursor-pointer"
                onChange={selectAll}
                checked={menuItems.length > 0 && selected.length === menuItems.length}
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </label>
            {selected.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {selected.length} selected
              </span>
            )}
          </div>

          {selected.length > 0 && (
            <button
              onClick={openBulkDeleteDialog}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 w-10">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Image</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {menuItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
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
                  }`}
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
                        <Image
                          src={item.image_url}
                          alt={item.name || "image"}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
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