"use client"

import { useState, useMemo } from "react"
import { useGetAllMenuItems } from "@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-menu-item"
import {
  MenuItemsResponse,
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
import { Input } from "@/components/ui/input"
import { EditMenuItemDialog } from "./new-update-menu-item-dialog-box"
import { MenuItemDeleteDialog } from "./delete-dialog-box"
import {
  Trash2, Pencil, UtensilsCrossed, ChevronDown,
  Hash, CheckCircle2, XCircle, Search, ArrowUpDown
} from "lucide-react"
import Image from "next/image"

type FilterTab = "all" | "active" | "off"

function NewAllMenuItemsGrouped() {
  const { data, isLoading } = useGetAllMenuItems()
  const grouped_menu = data?.grouped_menu
  const queryClient = useQueryClient()
  const { startUpload } = useUploadThing("imageUploader")

  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selected, setSelected] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<MenuItemWithCategory[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItemWithCategory | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTab, setFilterTab] = useState<FilterTab>("all")

  const { mutate: update_menu_item, isPending: updating_menu_item } = useUpdateMenuItems()
  const { mutate: delete_menu_items, isPending: deleting_menu_items } = useDeleteMenuItems()
  const isSaving = uploadingImage || updating_menu_item

  const categories = useMemo(() => (grouped_menu ? Object.values(grouped_menu) : []), [grouped_menu])

  const allItems: MenuItemWithCategory[] = useMemo(() => {
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

  const menuItems = useMemo(() => {
    let items = [...allItems]
    if (filterTab === "active") items = items.filter((i) => i.is_available)
    if (filterTab === "off") items = items.filter((i) => !i.is_available)
    if (searchTerm) items = items.filter((i) => i.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    return items
  }, [allItems, filterTab, searchTerm])

  const availableCount = allItems.filter((i) => i.is_available).length
  const unavailableCount = allItems.filter((i) => !i.is_available).length

  const allChecked = menuItems.length > 0 && selected.length === menuItems.length
  const someChecked = selected.length > 0 && selected.length < menuItems.length

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selected.length === menuItems.length) setSelected([])
    else setSelected(menuItems.map((item) => item.id))
  }

  const openBulkDeleteDialog = () => {
    setItemsToDelete(menuItems.filter((item) => selected.includes(item.id)))
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
      onError: (error) => toast.error(error.message || "Failed to delete menu items")
    })
  }

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
          if (data.image_url && data.image_url !== updatedImage) await removeMultipleImages([data.image_url])
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
          toast.error(error.message || "Failed to update menu item")
          setUploadingImage(false)
        }
      })
    } catch (error) {
      toast.error("Failed to upload image or update menu item")
      setUploadingImage(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground -mx-8 -mt-8">
        <div className="py-4 space-y-5">
          <div className="rounded-2xl border border-border bg-card px-8 py-7 shadow-sm animate-pulse">
            <div className="space-y-3">
              <div className="w-32 h-3 rounded-full bg-muted" />
              <div className="w-56 h-8 rounded-full bg-muted" />
              <div className="w-48 h-4 rounded-full bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!grouped_menu) {
    return (
      <main className="min-h-screen bg-background text-foreground -mx-8 -mt-8">
        <div className="py-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
                <div className="relative w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground">No menu items found</h3>
              <p className="text-xs text-muted-foreground">Add menu items from a category page.</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground -mx-8 -mt-8">
      <div className="py-4 space-y-5">

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl border border-border bg-card px-8 py-7 shadow-sm overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85)/12%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Menu Management</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">All Menu Items</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {allItems.length} items across {categories.length} categories
            </p>
          </div>
        </div>

        {/* ── KPI Stat Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.08_200)/10%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">{allItems.length}</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.6_0.15_150)/10%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">{availableCount}</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.22_25)/10%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Unavailable</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">{unavailableCount}</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85)/12%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">{categories.length}</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Filter / Search Toolbar ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
              />
            </div>

            {/* Segmented filter */}
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
              {([
                { key: "all", label: `All (${allItems.length})` },
                { key: "active", label: `Active (${availableCount})` },
                { key: "off", label: `Off (${unavailableCount})` },
              ] as { key: FilterTab; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 h-7 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                    filterTab === tab.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <select
                className="pl-9 pr-8 h-9 text-sm bg-muted/40 border border-border rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground cursor-pointer"
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
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>

          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">

                {/* Select-all checkbox in header */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked }}
                    onChange={selectAll}
                    disabled={deleting_menu_items || isSaving}
                  />
                </th>

                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Image</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Order</th>

                {/* Actions col — shows bulk delete when selected */}
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
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
                        <div className="relative w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                          <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">No menu items found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                menuItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-muted/20 transition-colors ${
                      selected.includes(item.id) ? "bg-accent/5" : ""
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
                      <span className="text-sm text-muted-foreground">{item.display_order}</span>
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
    </main>
  )
}

export default NewAllMenuItemsGrouped