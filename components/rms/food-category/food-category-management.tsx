"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Utensils,
  Plus,
  ChefHat,
  Sparkles,
  Search,
  Trash2,
  Edit2,
  X,
  Save,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react"
import { User } from "@/utils/types/user.types"
import { Category, UpdateCategoryType } from "@/utils/types/food-category.types"
import { useGetFoodCategories } from "@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-category"
import { NewCatType } from "@/utils/actions/food-category/food-category.post"
import { useCreateFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-create-food-category"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getErrorMessage } from "@/utils/helper/get-error-message"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUpdateFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-food-category"
import { useDeleteFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-food-category"

type SortType = "name-asc" | "name-desc" | "date-newest" | "date-oldest" | "active"


function FoodManagementPage({ user }: { user: User }) {
  const router = useRouter()
  const [catName, setCatName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortType>("date-newest")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<UpdateCategoryType | null>(null)

  const { data, isLoading, isError } = useGetFoodCategories()
  const { mutate: create_food_category, isPending } = useCreateFoodCategory()
  const { mutate: update_food_category, isPending: updatingFoodCategory } = useUpdateFoodCategory()
  const { mutate: delete_food_category, isPending: deletingFoodCategory } = useDeleteFoodCategory()
  const queryClient = useQueryClient()

  const categories: Category[] = useMemo(() => {
    if (isLoading) return []
    return data?.categories || []
  }, [data, isLoading])

  const createCategory = async () => {
    if (isPending) return
    try {
      const payload: NewCatType = { category_name: catName }
      create_food_category(payload, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ["get-all-categories"] })
            toast.success(res.message)
            setCatName("")
          }
        },
        onError: (err) => toast.error(err.message || "Failed to create category"),
      })
    } catch (error) {
      toast.error(getErrorMessage(error as string || "Failed to create category"))
    }
  }

  const handleUpdateCategory = async (updateData: UpdateCategoryType) => {
    update_food_category(updateData, {
      onSuccess: (res) => {
        if (res.message && res.success) {
          queryClient.invalidateQueries({ queryKey: ["get-all-categories"] })
          toast.success(res.message || "Category updated successfully")
          setEditingCategory(null)
          setEditFormData(null)
        }
      },
      onError: (error) => toast.error(error.message || "Failed to update category"),
    })
  }

  const handleDeleteCategories = async (categoryIds: string[]) => {
    if (categoryIds.length === 0 || deletingFoodCategory) return
    delete_food_category(categoryIds, {
      onSuccess: (res) => {
        if (res.message && res.success) {
          queryClient.invalidateQueries({ queryKey: ["get-all-categories"] })
          toast.success(res.message || `${categoryIds.length} categor${categoryIds.length === 1 ? "y" : "ies"} deleted`)
          setSelectedCategories([])
          setIsDeleteDialogOpen(false)
        }
      },
      onError: (error) => toast.error(error.message || "Failed to delete categories"),
    })
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredAndSortedCategories.length)
      setSelectedCategories([])
    else setSelectedCategories(filteredAndSortedCategories.map((c) => c.id))
  }

  const handleSelectCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const startEditing = (cat: Category) => {
    setEditingCategory(cat.id)
    setEditFormData({ id: cat.id, name: cat.name, is_active: cat.is_active })
  }

  const cancelEditing = () => { setEditingCategory(null); setEditFormData(null) }

  const handleEditChange = (field: keyof UpdateCategoryType, value: any) => {
    if (!editFormData) return
    setEditFormData({ ...editFormData, [field]: value })
  }

  const handleVisit = (slug: string) => router.push(`/food-category/${slug}`)

  const filteredAndSortedCategories = useMemo(() => {
    const filtered = categories.filter((c: Category) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return filtered.sort((a: Category, b: Category) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name)
        case "name-desc": return b.name.localeCompare(a.name)
        case "date-newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "date-oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "active": return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
        default: return 0
      }
    })
  }, [categories, searchQuery, sortBy])

  const activeCount = categories.filter((c) => c.is_active).length
  const inactiveCount = categories.filter((c) => !c.is_active).length

  if (isError) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-3xl border border-destructive/20" />
            <div className="relative w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Utensils className="w-7 h-7 text-destructive" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Failed to load categories</h2>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </main>
    )
  }

  const isUpdating = updatingFoodCategory || deletingFoodCategory

  return (
    <main className="min-h-screen bg-background text-foreground -m-6">
      <div className="max-w-18xl mx-auto px-6 py-6 space-y-5">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div className="relative rounded-2xl border border-border bg-card px-8 py-7 shadow-sm overflow-hidden">
          {/* Gold radial glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85)/12%,transparent_70%)]" />
          {/* Bottom gold line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          <div className="relative z-10">
            {/* Accent label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-1 h-5 rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                Menu Management
              </span>
            </div>

            {/* Title row + inline add-category */}
            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* Left: title + description */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Food Categories
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Manage and organize your restaurant menu structure.
                </p>
              </div>

              {/* Right: add-category input + button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="New category name…"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createCategory()}
                  className="h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors w-full sm:w-52"
                  disabled={isUpdating}
                />
                <Button
                  onClick={createCategory}
                  disabled={catName.trim().length <= 2 || isPending || isUpdating}
                  className="rounded-xl h-9 gap-2 text-sm shrink-0 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span className="hidden sm:inline">Adding…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ Add Category</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total */}
          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.08_200)/10%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 shrink-0">
                <LayoutGrid className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Categories</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">
                  {isLoading ? <span className="w-8 h-7 rounded bg-muted animate-pulse block" /> : categories.length}
                </p>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.6_0.15_150)/10%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">
                  {isLoading ? <span className="w-8 h-7 rounded bg-muted animate-pulse block" /> : activeCount}
                </p>
              </div>
            </div>
          </div>

          {/* Inactive */}
          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.22_25)/10%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 shrink-0">
                <XCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Inactive</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">
                  {isLoading ? <span className="w-8 h-7 rounded bg-muted animate-pulse block" /> : inactiveCount}
                </p>
              </div>
            </div>
          </div>

          {/* Filtered */}
          <div className="relative rounded-2xl border border-border bg-card px-6 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
            <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85)/12%,transparent_70%)]" />
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 shrink-0">
                <Filter className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Filtered</p>
                <p className="text-3xl font-bold text-foreground leading-none mt-1">
                  {isLoading ? <span className="w-8 h-7 rounded bg-muted animate-pulse block" /> : filteredAndSortedCategories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section row: title + delete button ──────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Your Categories
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {filteredAndSortedCategories.length}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedCategories.length > 0 ? (
                <span className="text-accent font-medium">
                  {selectedCategories.length} selected
                </span>
              ) : (
                `Showing ${filteredAndSortedCategories.length} of ${categories.length} categories`
              )}
            </p>
          </div>
          {selectedCategories.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deletingFoodCategory || isUpdating}
              className="rounded-xl h-8 text-xs gap-1.5 cursor-pointer"
            >
              {deletingFoodCategory ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete ({selectedCategories.length})
            </Button>
          )}
        </div>

        {/* ── Toolbar: select-all + search + sort ─────────────────────── */}
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md px-5 py-3.5 shadow-sm sticky top-0 z-30">
          <div className="flex flex-col sm:flex-row gap-3">
            {filteredAndSortedCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedCategories.length > 0 &&
                    selectedCategories.length === filteredAndSortedCategories.length
                  }
                  onCheckedChange={handleSelectAll}
                  disabled={isUpdating}
                  className="cursor-pointer"
                />
                <Label
                  htmlFor="select-all"
                  className="text-xs cursor-pointer text-muted-foreground select-none"
                >
                  Select All
                </Label>
              </div>
            )}

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by category name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
                disabled={isUpdating}
              />
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="pl-9 pr-8 h-9 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
                disabled={isUpdating}
              >
                <option value="date-newest">Newest First</option>
                <option value="date-oldest">Oldest First</option>
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="active">Active First</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Categories grid ─────────────────────────────────────────── */}
        <div className="max-h-[36rem] overflow-y-auto pr-1 scrollbar-hide">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-44 bg-muted/40 rounded-2xl animate-pulse border border-border" />
              ))}
            </div>
          ) : filteredAndSortedCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedCategories.map((cat: Category) => (
                <div
                  key={cat.id}
                  className={`relative rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200 group ${
                    editingCategory === cat.id
                      ? "border-accent/60 ring-1 ring-accent/40 shadow-md"
                      : selectedCategories.includes(cat.id)
                      ? "border-accent/50 ring-1 ring-accent/30 bg-accent/5"
                      : "border-border hover:shadow-md hover:-translate-y-0.5 hover:border-border/80"
                  } ${isUpdating ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {/* Top hover accent line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent transition-opacity ${
                      editingCategory === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />

                  <div className="p-5 flex flex-col gap-3">

                    {/* ── EDIT MODE ──────────────────────────────────── */}
                    {editingCategory === cat.id ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                            Editing
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateCategory(editFormData!)}
                              disabled={updatingFoodCategory}
                              title="Save"
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {updatingFoodCategory ? (
                                <span className="w-3 h-3 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={updatingFoodCategory}
                              title="Cancel"
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <Input
                          value={editFormData?.name || ""}
                          onChange={(e) => handleEditChange("name", e.target.value)}
                          className="h-8 text-sm bg-background border-border rounded-xl"
                          placeholder="Category name"
                          autoFocus
                          disabled={updatingFoodCategory}
                        />
                        <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border px-3 py-2">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            id={`active-${cat.id}`}
                            checked={editFormData?.is_active ?? true}
                            onCheckedChange={(checked) => handleEditChange("is_active", checked)}
                            disabled={updatingFoodCategory}
                          />
                        </div>
                      </div>

                    ) : (
                      /* ── VIEW MODE ─────────────────────────────────── */
                      <>
                        <div className="flex-1 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <Checkbox
                                checked={selectedCategories.includes(cat.id)}
                                onCheckedChange={() => handleSelectCategory(cat.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-0.5 cursor-pointer"
                                disabled={isUpdating}
                              />
                              <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
                                {cat.name}
                              </h3>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                                cat.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              <span
                                className={`w-1 h-1 rounded-full ${
                                  cat.is_active ? "bg-emerald-500" : "bg-muted-foreground/60"
                                }`}
                              />
                              {cat.is_active ? "Active" : "Off"}
                            </span>
                          </div>

                          <p className="text-xs font-mono bg-muted/50 border border-border px-2.5 py-1 rounded-lg text-muted-foreground w-fit max-w-full truncate">
                            /{cat.slug}
                          </p>

                          {cat.display_order !== undefined && (
                            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                              <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
                              {cat.display_order}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditing(cat) }}
                            disabled={isUpdating}
                            title="Edit category"
                            className="h-9 w-9 rounded-xl flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border/80 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVisit(cat.slug)}
                            disabled={isUpdating}
                            className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium border border-border text-muted-foreground bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 cursor-pointer disabled:opacity-40 group/visit"
                          >
                            <span>Open</span>
                            {/* <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover/visit:opacity-100 transition-opacity" /> */}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card shadow-sm p-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
                  <div className="relative w-14 h-14 rounded-3xl bg-muted/60 border border-border flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-foreground">No categories found</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  {searchQuery
                    ? "No categories match your search."
                    : "Use the field above to create your first category."}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <AlertDialogHeader className="relative px-6 pt-6 pb-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-base font-semibold text-foreground tracking-tight">
                  Delete Categories
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Delete {selectedCategories.length} selected categor
                  {selectedCategories.length === 1 ? "y" : "ies"}? This cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 pb-6 pt-4 border-t border-border flex justify-end gap-2">
            <AlertDialogCancel
              disabled={deletingFoodCategory}
              className="rounded-xl h-9 text-sm border-border bg-muted/30 hover:bg-muted/60 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCategories(selectedCategories)}
              disabled={deletingFoodCategory}
              className="rounded-xl h-9 text-sm bg-destructive hover:bg-destructive/90 text-white min-w-24 gap-2 cursor-pointer"
            >
              {deletingFoodCategory ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default FoodManagementPage