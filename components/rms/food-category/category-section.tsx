'use client'

import { memo, useState, useMemo, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Coffee, Key } from 'lucide-react'
import { Category, CategoryData, MenuItem, UpdateCategoryType, UpdateMenuItemType } from '@/utils/types/food-category.types'
import { SearchFilter } from './search-filter'
import { CategorySelectionHeader, MenuItemSelectionHeader } from './selection-headers'
import { ScrollableSection } from './scrollable-section'
import { CategoryCard } from './category-card'
import { MenuItemCard } from './menu-item-card'
import { EmptyState } from './empty-state'
import { CategoryDeleteDialog, MenuItemDeleteDialog } from './delete-dialog-box'
import { EditCategoryDialog, EditMenuItemDialog, } from './edit-dialog'
import { useUpdateFoodCategory } from '@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-food-category'
import { useUpdateMenuItems } from '@/utils/hooks/tanstack-query/mutate-hook/food-category/use-update-menu-items'
import { useDeleteFoodCategory } from '@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-food-category'
import { useDeleteMenuItems } from '@/utils/hooks/tanstack-query/mutate-hook/food-category/use-delete-menu-items'
import { useQueryClient } from '@tanstack/react-query'
import { removeMultipleImages } from '@/utils/actions/uploadthing/delete-images'
import { useUploadThing } from '@/utils/uploadthing/uploadthing-client'
import { toast } from 'sonner'


interface CategoryDisplayProps {
  category: CategoryData
  slugs: string[]
  refetch: () => void
}

export const CategoryDisplay = memo(function CategoryDisplay({
  category,
  slugs,
  refetch
}: CategoryDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<string>>(new Set())
  const [showCategoryDeleteDialog, setShowCategoryDeleteDialog] = useState(false)
  const [showMenuItemDeleteDialog, setShowMenuItemDeleteDialog] = useState(false)
  const [categorySelectionMode, setCategorySelectionMode] = useState(false)
  const [itemSelectionMode, setItemSelectionMode] = useState(false)


  // Edit dialogs state
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editMenuItem, setEditMenuItem] = useState<MenuItem | null>(null)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)
  const [showEditMenuItemDialog, setShowEditMenuItemDialog] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)


  // Loading states for operations

  const queryClient = useQueryClient()
  const { startUpload } = useUploadThing("imageUploader");




  const { mutate: update_food_category, isPending: updating_food_category } = useUpdateFoodCategory();
  const { mutate: update_menu_item, isPending: updating_menu_item } = useUpdateMenuItems()
  const { mutate: delete_food_category, isPending: deleting_food_category } = useDeleteFoodCategory();
  const { mutate: delete_menu_items, isPending: deleting_menu_items } = useDeleteMenuItems()

  const isUploading = uploadingImage || updating_menu_item

  // Get current category name for menu items
  const currentCategoryName = useMemo(() => {
    return category.breadcrumb?.length
      ? category.breadcrumb[category.breadcrumb.length - 1].name
      : '';
  }, [category.breadcrumb]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!category.children) return []
    if (!searchTerm) return category.children

    return category.children.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [category.children, searchTerm])

  // Filter menu items based on search
  const filteredMenuItems = useMemo(() => {
    if (!category.menu_items) return []
    if (!searchTerm) return category.menu_items

    return category.menu_items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [category.menu_items, searchTerm])

  const hasCategories = filteredCategories.length > 0
  const hasMenuItems = filteredMenuItems.length > 0

  // Selection handlers for categories
  const toggleCategory = useCallback((id: string, checked: boolean) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  // Selection handlers for menu items
  const toggleMenuItem = useCallback((id: string, checked: boolean) => {
    setSelectedMenuItems(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  const selectAllCategories = useCallback(() => {
    if (selectedCategories.size === filteredCategories.length) {
      setSelectedCategories(new Set())
    } else {
      setSelectedCategories(new Set(filteredCategories.map(c => c.id)))
    }
  }, [filteredCategories, selectedCategories.size])

  const selectAllMenuItems = useCallback(() => {
    if (selectedMenuItems.size === filteredMenuItems.length) {
      setSelectedMenuItems(new Set())
    } else {
      setSelectedMenuItems(new Set(filteredMenuItems.map(i => i.id)))
    }
  }, [filteredMenuItems, selectedMenuItems.size])

  const clearCategorySelections = useCallback(() => {
    setSelectedCategories(new Set())
  }, [])

  const clearMenuItemSelections = useCallback(() => {
    setSelectedMenuItems(new Set())
  }, [])

  const handleDeleteSelectedCategories = useCallback(() => {
    setShowCategoryDeleteDialog(true)
  }, [])

  const handleDeleteSelectedMenuItems = useCallback(() => {
    setShowMenuItemDeleteDialog(true)
  }, [])

  // CRUD Operations
  const handleEditCategory = (category: Category) => {
    setEditCategory(category)
    setShowEditCategoryDialog(true)
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setEditMenuItem(item)
    setShowEditMenuItemDialog(true)
  }

  const handleSaveCategory = async (data: UpdateCategoryType) => {

    try {
      update_food_category(data, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ['get-all-by-slug', slugs.join('/')] })
            toast.success(res.message || "Category updated successfully")
            setShowEditCategoryDialog(false)
          }
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update category')
        }
      })
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error // Re-throw to be handled by the dialog
    }
  }

  const handleSaveMenuItem = async (data: UpdateMenuItemType, imageFile?: File) => {
    try {
      setUploadingImage(true); // Set loading state at the beginning

      let updatedImage: string | null = data.image_url || null

      // If imageFile is undefined and there was an image URL (meaning user removed the image)
      if (!imageFile && data.image_url) {
        await removeMultipleImages([data.image_url])
        updatedImage = null;
      }

      // If there's a new image file to upload
      if (imageFile) {
        const uploadResults = await startUpload([imageFile])
        if (uploadResults && uploadResults.length > 0) {
          updatedImage = uploadResults[0].ufsUrl;

          // If there was an old image and it's different from the new one, delete it
          if (data.image_url && data.image_url !== updatedImage) {
            await removeMultipleImages([data.image_url])
          }
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Prepare the updated data
      const updatedData = {
        ...data,
        image_url: updatedImage
      }

      // Update the menu item with the new data
      update_menu_item(updatedData, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({
              queryKey: ['get-all-by-slug', slugs.join('/')]
            })
            toast.success(res.message || "Menu item updated successfully")
            setShowEditMenuItemDialog(false)
          }
          setUploadingImage(false); // Reset loading state
        },
        onError: (error) => {
          console.error('Failed to update menu item:', error)
          toast.error(error.message || 'Failed to update menu item')
          setUploadingImage(false); // Reset loading state on error
        }
      })
    } catch (error) {
      console.error('Failed to update menu item:', error)
      toast.error('Failed to upload image or update menu item')
      setUploadingImage(false); // Reset loading state on error
      throw error
    }
  }
  const confirmDeleteCategories = async () => {
    if (selectedCategories.size === 0 || deleting_food_category) return


    try {
      const ids = Array.from(selectedCategories)
      delete_food_category(ids, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            toast.success(res.message)
            setSelectedCategories(new Set())
            setCategorySelectionMode(false)
            setShowCategoryDeleteDialog(false)
            queryClient.invalidateQueries({ queryKey: ['get-all-by-slug', slugs.join('/')] })
          }
        },
        onError: (error) => {
          console.error('Failed to delete categories:', error)
          toast.error(error.message || 'Failed to delete categories')
        }
      })
    } catch (error) {
      console.error('Failed to delete categories:', error)
    }
  }

  const confirmDeleteMenuItems = async () => {
    if (selectedMenuItems.size === 0 || deleting_menu_items) return

    console.log("deleting : ", selectedMenuItems)

    try {
      const ids = Array.from(selectedMenuItems)
      console.log("thisi s ids : ", ids)
      delete_menu_items(ids, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            toast.success(res.message)
            setSelectedMenuItems(new Set())
            setItemSelectionMode(false)
            setShowMenuItemDeleteDialog(false)
            queryClient.invalidateQueries({ queryKey: ['get-all-by-slug', slugs.join('/')] })
          }
        },
        onError: (error) => {
          console.error('Failed to delete menu items:', error)
          toast.error(error.message || 'Failed to delete menu items')
        }
      })
    } catch (error) {
      console.error('Failed to delete menu items:', error)
    }
  }

  const handleDeleteSingleCategory = async (id: string) => {
    setSelectedCategories(new Set([id]))
    setShowCategoryDeleteDialog(true)
  }

  const handleDeleteSingleMenuItem = async (id: string) => {
    setSelectedMenuItems(new Set([id]))
    setShowMenuItemDeleteDialog(true)
  }

  const handleToggleMenuItemAvailability = async (item: MenuItem) => {
    try {
      update_menu_item({ ...item, is_available: !item.is_available }, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ['get-all-by-slug', slugs.join('/')] })
            toast.success(res.message || "Menu item availability updated")
          }
        },
        onError: (error) => {
          console.error('Failed to toggle availability:', error)
          toast.error(error.message || 'Failed to update menu item availability')
        }
      })
    } catch (error) {
      console.error('Failed to toggle availability:', error)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  // Toggle category selection mode - turns off item selection mode
  const toggleCategorySelectionMode = useCallback(() => {
    setCategorySelectionMode(prev => {
      if (!prev) {
        setItemSelectionMode(false)
        setSelectedMenuItems(new Set())
      }
      return !prev
    })
  }, [])

  // Toggle item selection mode - turns off category selection mode
  const toggleItemSelectionMode = useCallback(() => {
    setItemSelectionMode(prev => {
      if (!prev) {
        setCategorySelectionMode(false)
        setSelectedCategories(new Set())
      }
      return !prev
    })
  }, [])

  // Get selected items for delete dialogs
  const selectedCategoryObjects = useMemo(() =>
    filteredCategories.filter(c => selectedCategories.has(c.id)),
    [filteredCategories, selectedCategories]
  )

  const selectedMenuItemObjects = useMemo(() =>
    filteredMenuItems.filter(i => selectedMenuItems.has(i.id)),
    [filteredMenuItems, selectedMenuItems]
  )

  return (
    <div className="space-y-6">

      {/* Tabs for different views */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1">
                {(filteredCategories.length + filteredMenuItems.length)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Categories
              <Badge variant="secondary" className="ml-1">
                {filteredCategories.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Coffee className="h-4 w-4" />
              Menu Items
              <Badge variant="secondary" className="ml-1">
                {filteredMenuItems.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <SearchFilter onSearch={setSearchTerm} searchTerm={searchTerm} />
        </div>

        {/* All Tab Content */}
        <TabsContent value="all" className="space-y-8">
          {/* Categories Section */}
          {hasCategories && (
            <section>
              <CategorySelectionHeader
                isActive={categorySelectionMode}
                selectedCount={selectedCategories.size}
                totalCount={filteredCategories.length}
                onToggleMode={toggleCategorySelectionMode}
                onClearSelection={clearCategorySelections}
                onDeleteSelected={handleDeleteSelectedCategories}
                onSelectAll={selectAllCategories}
              />

              <ScrollableSection className="h-[calc(80vh-100px)] p-4 mb-8">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    isSelected={selectedCategories.has(cat.id)}
                    isSelectionMode={categorySelectionMode}
                    onSelect={toggleCategory}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteSingleCategory}
                    currentPath={slugs.join('/')}
                  />
                ))}
              </ScrollableSection>
            </section>
          )}

          {/* Menu Items Section */}
          {hasMenuItems && (
            <section>
              <MenuItemSelectionHeader
                isActive={itemSelectionMode}
                selectedCount={selectedMenuItems.size}
                totalCount={filteredMenuItems.length}
                onToggleMode={toggleItemSelectionMode}
                onClearSelection={clearMenuItemSelections}
                onDeleteSelected={handleDeleteSelectedMenuItems}
                onSelectAll={selectAllMenuItems}
              />

              <ScrollableSection className="h-[calc(80vh-100px)] p-4">
                {filteredMenuItems
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      categoryName={currentCategoryName}
                      isSelected={selectedMenuItems.has(item.id)}
                      isSelectionMode={itemSelectionMode}
                      onSelect={toggleMenuItem}
                      onEdit={handleEditMenuItem}
                      onDelete={handleDeleteSingleMenuItem}
                      onToggleAvailability={handleToggleMenuItemAvailability}
                    />
                  ))}
              </ScrollableSection>
            </section>
          )}

          {/* Empty State for All tab */}
          {!hasCategories && !hasMenuItems && (
            <EmptyState type="items" searchTerm={searchTerm} onClear={handleClearSearch} />
          )}
        </TabsContent>

        {/* Categories Only Tab */}
        <TabsContent value="categories">
          {hasCategories ? (
            <section>
              <CategorySelectionHeader
                isActive={categorySelectionMode}
                selectedCount={selectedCategories.size}
                totalCount={filteredCategories.length}
                onToggleMode={toggleCategorySelectionMode}
                onClearSelection={clearCategorySelections}
                onDeleteSelected={handleDeleteSelectedCategories}
                onSelectAll={selectAllCategories}
              />

              <ScrollableSection className="h-[calc(100vh-300px)] pr-4">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    isSelected={selectedCategories.has(cat.id)}
                    isSelectionMode={categorySelectionMode}
                    onSelect={toggleCategory}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteSingleCategory}
                    currentPath={slugs.join("/")}
                  />
                ))}
              </ScrollableSection>
            </section>
          ) : (
            <EmptyState type="categories" searchTerm={searchTerm} onClear={handleClearSearch} />
          )}
        </TabsContent>

        {/* Menu Items Only Tab */}
        <TabsContent value="items">
          {hasMenuItems ? (
            <section>
              <MenuItemSelectionHeader
                isActive={itemSelectionMode}
                selectedCount={selectedMenuItems.size}
                totalCount={filteredMenuItems.length}
                onToggleMode={toggleItemSelectionMode}
                onClearSelection={clearMenuItemSelections}
                onDeleteSelected={handleDeleteSelectedMenuItems}
                onSelectAll={selectAllMenuItems}
              />

              <ScrollableSection className="h-[calc(100vh-300px)] pr-4">
                {filteredMenuItems
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      categoryName={currentCategoryName}
                      isSelected={selectedMenuItems.has(item.id)}
                      isSelectionMode={itemSelectionMode}
                      onSelect={toggleMenuItem}
                      onEdit={handleEditMenuItem}
                      onDelete={handleDeleteSingleMenuItem}
                      onToggleAvailability={handleToggleMenuItemAvailability}
                    />
                  ))}
              </ScrollableSection>
            </section>
          ) : (
            <EmptyState type="items" searchTerm={searchTerm} onClear={handleClearSearch} />
          )}
        </TabsContent>
      </Tabs>

      {/* Category Delete Confirmation Dialog */}
      <CategoryDeleteDialog
        open={showCategoryDeleteDialog}
        onOpenChange={setShowCategoryDeleteDialog}
        onConfirm={confirmDeleteCategories}
        categories={selectedCategoryObjects}
        isDeleting={deleting_food_category}
      />

      {/* Menu Item Delete Confirmation Dialog */}
      <MenuItemDeleteDialog
        open={showMenuItemDeleteDialog}
        onOpenChange={setShowMenuItemDeleteDialog}
        onConfirm={confirmDeleteMenuItems}
        items={selectedMenuItemObjects}
        isDeleting={deleting_menu_items}
      />

      {/* Edit Dialogs */}
      <EditCategoryDialog
        category={editCategory}
        open={showEditCategoryDialog}
        onOpenChange={setShowEditCategoryDialog}
        onSave={handleSaveCategory}
        isSaving={updating_food_category}
      />

      <EditMenuItemDialog
        item={editMenuItem}
        open={showEditMenuItemDialog}
        onOpenChange={setShowEditMenuItemDialog}
        onSave={handleSaveMenuItem}
        isSaving={isUploading}
      />
    </div>
  )
})