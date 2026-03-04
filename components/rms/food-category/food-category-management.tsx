"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowRight, 
  Utensils, 
  Plus, 
  ChefHat, 
  Sparkles, 
  Search, 
  ArrowUpDown,
  Trash2,
  Edit2,
  X,
  Save,
  Loader2
} from "lucide-react"
import { User } from "@/utils/types/user.types"
import { Category } from "@/utils/types/food-category.types"
import { useGetFoodCategories } from "@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-category"
import { createFoodCategory, NewCatType } from "@/utils/actions/food-category/food-category.post"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUpdateFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-food-category"
import { useDeleteFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-food-category"

type SortType = "name-asc" | "name-desc" | "date-newest" | "date-oldest" | "active"

// Types for update and delete
interface UpdateCategoryType {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}

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
  const { mutate: update_food_category, isPending: updatingFoodCategory } = useUpdateFoodCategory();
  const { mutate: delete_food_category, isPending: deletingFoodCategory } = useDeleteFoodCategory()
  const queryClient = useQueryClient()

  const categories: Category[] = useMemo(() => {
    if (isLoading) return []
    if (data?.categories) {
      return data.categories
    }
    return []
  }, [data, isLoading])

  const createCategory = async () => {
    if (isPending) return
    try {
      const data: NewCatType = {
        category_name: catName,
        slug_path: [],
      }
      create_food_category(data, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ["get-all-categories"] })
            toast.success(res.message)
            setCatName("")
          }
        },
        onError: (err) => {
          toast.error(err.message || "failed to create category")
        }
      })
    } catch (error) {
      toast.error(getErrorMessage(error as string || "failed to create user"))
    }
  }

  // Update category handler
  const handleUpdateCategory = async (updateData: UpdateCategoryType) => {
    try {
      update_food_category(updateData, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ["get-all-categories"] })
            toast.success(res.message || "Category updated successfully")
            setEditingCategory(null)
            setEditFormData(null)
          }
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update category')
        }
      })
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }

  // Delete categories handler
  const handleDeleteCategories = async (categoryIds: string[]) => {
    if (categoryIds.length === 0 || deletingFoodCategory) return

    try {
      delete_food_category(categoryIds, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ["get-all-categories"] })
            toast.success(res.message || `${categoryIds.length} categor${categoryIds.length === 1 ? 'y' : 'ies'} deleted successfully`)
            setSelectedCategories([])
            setIsDeleteDialogOpen(false)
          }
        },
        onError: (error) => {
          console.error('Failed to delete categories:', error)
          toast.error(error.message || 'Failed to delete categories')
        }
      })
    } catch (error) {
      console.error('Failed to delete categories:', error)
      toast.error('Failed to delete categories')
    }
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredAndSortedCategories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(filteredAndSortedCategories.map(cat => cat.id))
    }
  }

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const startEditing = (category: Category) => {
    setEditingCategory(category.id)
    setEditFormData({
      id: category.id,
      name: category.name,
      is_active: category.is_active,
      display_order: category.display_order || 0
    })
  }

  const cancelEditing = () => {
    setEditingCategory(null)
    setEditFormData(null)
  }

  const handleEditChange = (field: keyof UpdateCategoryType, value: any) => {
    if (!editFormData) return
    setEditFormData({ ...editFormData, [field]: value })
  }

  const handleVisit = (slug: string) => {
    router.push(`/food-category/${slug}`)
  }

  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter((cat: Category) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a: Category, b: Category) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "date-newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        case "date-oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          )
        case "active":
          return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
        default:
          return 0
      }
    })
  }, [categories, searchQuery, sortBy])

  // Handle error state
  if (isError) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <Utensils className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-2xl font-light">Failed to load categories</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </main>
    )
  }

  const isUpdating = updatingFoodCategory || deletingFoodCategory;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Premium Header Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-background via-background to-transparent pb-12 pt-16">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Decorative Elements */}
          <div className="pointer-events-none absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-40 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />

          {/* Header Content */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/15 rounded-xl backdrop-blur-sm">
                <ChefHat className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-balance">
                  Food Categories
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Organize and manage your culinary collection
                </p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row gap-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <Input
                placeholder="Enter new category name..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createCategory()}
                className="flex-1 h-11 text-base border-border/50 bg-background/50 rounded-lg"
                disabled={isUpdating}
              />
              <Button
                onClick={createCategory}
                disabled={catName.trim().length <= 2 || isPending || isUpdating}
                className="sm:w-40 h-11 gap-2 font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Add Category
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="space-y-6">
          {/* Header with Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-light tracking-tight">
                Your Categories
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCategories.length > 0 ? (
                  <span className="text-primary font-medium">
                    {selectedCategories.length} selected
                  </span>
                ) : (
                  `Manage ${filteredAndSortedCategories.length} of ${categories.length} categories`
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedCategories.length > 0 && (
                <>
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedCategories.length} selected
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="gap-2"
                    disabled={deletingFoodCategory || isUpdating}
                  >
                    {deletingFoodCategory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete Selected
                  </Button>
                </>
              )}
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Toolbar (Sticky) */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Select All Checkbox */}
              {filteredAndSortedCategories.length > 0 && (
                <div className="flex items-center gap-2 px-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedCategories.length === filteredAndSortedCategories.length}
                    onCheckedChange={handleSelectAll}
                    disabled={isUpdating}
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All
                  </Label>
                </div>
              )}

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by category name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-background/50 border-border/50 rounded-lg"
                  disabled={isUpdating}
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="pl-10 pr-4 h-10 bg-background/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isUpdating}
                >
                  <option value="date-newest">Newest First</option>
                  <option value="date-oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="active">Active First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable Categories Area */}
          <div className="max-h-96 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-lg">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted/40 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredAndSortedCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredAndSortedCategories.map((cat: Category) => (
                  <Card
                    key={cat.id}
                    className={`border border-border/50 bg-card/40 transition-all duration-300 rounded-2xl group ${
                      editingCategory === cat.id ? 'ring-2 ring-primary' : ''
                    } ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      {editingCategory === cat.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <Input
                              value={editFormData?.name || ''}
                              onChange={(e) => handleEditChange('name', e.target.value)}
                              className="text-base font-medium"
                              placeholder="Category name"
                              autoFocus
                              disabled={updatingFoodCategory}
                            />
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUpdateCategory(editFormData!)}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                disabled={updatingFoodCategory}
                              >
                                {updatingFoodCategory ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={updatingFoodCategory}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`active-${cat.id}`}
                                checked={editFormData?.is_active}
                                onCheckedChange={(checked) => handleEditChange('is_active', checked)}
                                disabled={updatingFoodCategory}
                              />
                              <Label htmlFor={`active-${cat.id}`} className="text-xs">
                                Active
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Display Order:</Label>
                              <Input
                                type="number"
                                value={editFormData?.display_order}
                                onChange={(e) => handleEditChange('display_order', parseInt(e.target.value) || 0)}
                                className="w-20 h-8 text-xs"
                                min={0}
                                disabled={updatingFoodCategory}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={selectedCategories.includes(cat.id)}
                                  onCheckedChange={() => handleSelectCategory(cat.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1"
                                  disabled={isUpdating}
                                />
                                <h3 className="text-lg font-light group-hover:text-primary transition-colors">
                                  {cat.name}
                                </h3>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  cat.is_active
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {cat.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <p className="text-xs font-mono bg-muted/40 px-2 py-1 rounded-lg w-fit">
                              /{cat.slug}
                            </p>
                            
                            {cat.display_order !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Display Order: {cat.display_order}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(cat)
                              }}
                              className="flex-1 gap-2 rounded-lg"
                              disabled={isUpdating}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVisit(cat.slug)}
                              className="flex-1 gap-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                              disabled={isUpdating}
                            >
                              Visit
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border/50 bg-card/40 rounded-2xl">
                <CardContent className="p-16 text-center">
                  <Utensils className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No categories match your search." : "No categories found. Create your first one!"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCategories.length} selected categor{selectedCategories.length === 1 ? 'y' : 'ies'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingFoodCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCategories(selectedCategories)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletingFoodCategory}
            >
              {deletingFoodCategory ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default FoodManagementPage