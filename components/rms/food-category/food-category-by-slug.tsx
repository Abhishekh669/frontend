'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useGetFoodCategoriesBySlug } from '@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-by-slug'
import { RefreshCw, AlertCircle, Image as ImageIcon, Search, ChevronRight, FolderOpen, Coffee, Utensils, Edit2, Trash2, Clock, DollarSign, Package } from 'lucide-react'
import { memo, useState, useMemo } from 'react'
import Link from 'next/link'
import { Category } from '@/utils/types/food-category.types'
import AddCategoryNMenuPage from './add-category-n-menu'
import Image from 'next/image'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types based on the API response
interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category_id: string;
  is_available: boolean;
  image_url?: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  category_name?: string; // Added for category name reference
}

interface CategoryData {
  success: boolean;
  breadcrumb: Category[];
  children: Category[];
  menu_items: MenuItem[];
}

// Loading Skeleton Component
const CategoryLoadingSkeleton = memo(function CategoryLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Breadcrumb skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />

        {/* Categories skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-56 rounded-lg" />
          ))}
        </div>

        {/* Menu items skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-72 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
})

// Error State Component
const ErrorState = memo(function ErrorState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Alert variant="destructive" className="border-red-500 bg-red-50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Category</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex items-center justify-between">
          <span>Failed to load category. Please try again.</span>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="ml-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
})

// Breadcrumb Navigation Component
const BreadcrumbNavigation = memo(function BreadcrumbNavigation({ items }: { items: Category[] }) {
  if (!items || items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/menu">Menu</BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage className="capitalize">
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={`/menu/${item.slug}`}
                  className="capitalize"
                >
                  {item.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
})

// Category Card Component with Actions
const CategoryCard = memo(function CategoryCard({ category }: { category: Category }) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit category:', category.id);
    // Add your edit logic here
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete category:', category.id);
    // Add your delete logic here
  };

  return (
    <Link href={`/menu/${category.slug}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group h-55 flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-37.5">{category.name}</span>
            </CardTitle>
            <Badge variant="secondary">Level {category.level}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <p className="text-sm text-muted-foreground line-clamp-2">
            Browse subcategories and items in {category.name}
          </p>
          
          
        </CardContent>
        <CardFooter className="pt-2 shrink-0 border-t">
          <div className="flex w-full gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 gap-2 group-hover:bg-primary/5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              View Items
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
})

// Menu Item Card Component with Actions and Category Name
const MenuItemCard = memo(function MenuItemCard({ item, categoryName }: { item: MenuItem; categoryName?: string }) {
  const isAvailable = item.is_available
  const formattedPrice = typeof item.price === 'number'
    ? item.price.toFixed(2)
    : parseFloat(item.price as any).toFixed(2)

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit menu item:', item.id);
    // Add your edit logic here
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete menu item:', item.id);
    // Add your delete logic here
  };

  const handleToggleAvailability = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle availability:', item.id);
    // Add your toggle availability logic here
  };

  return (
    <Card
      className={`overflow-hidden transition-all  flex flex-col ${!isAvailable ? 'opacity-75' : 'hover:shadow-lg'
        }`}
    >
      {/* Image section - fixed height */}
      <div className="relative h-32 w-full bg-linear-to-br from-gray-100 to-gray-200 shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            height={5000}
            width={5000}
            className="object-fill h-55 w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">Unavailable</Badge>
          </div>
        )}
        
        {/* Display order badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm"
        >
          Order: {item.display_order}
        </Badge>
      </div>

      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{item.name}</CardTitle>
            {categoryName && (
              <p className="text-xs text-muted-foreground mt-1">
                Category: <span className="font-medium">{categoryName}</span>
              </p>
            )}
          </div>
          <div className="text-lg font-bold text-primary whitespace-nowrap">
            Rs{formattedPrice}
          </div>
        </div>  
      </CardHeader>

      {/* Scrollable content area */}
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-2">
          {item.description && (
            <CardDescription className="text-sm mb-2">
              {item.description}
            </CardDescription>
          )}
          
          {/* Additional details */}
          <div className="space-y-1.5 text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              <span>Price: Rs{formattedPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isAvailable ? "default" : "destructive"} className="text-xs">
                {isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      {/* Action buttons - fixed at bottom */}
      <CardFooter className="pt-2 border-t mt-auto shrink-0">
        <div className="flex w-full gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleToggleAvailability}
          >
            {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleEdit}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
})

// Search and Filter Component
const SearchFilter = memo(function SearchFilter({
  onSearch,
  searchTerm
}: {
  onSearch: (term: string) => void
  searchTerm: string
}) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search categories and menu items..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10 w-full"
      />
    </div>
  )
})

// Empty State Component
const EmptyState = memo(function EmptyState({
  type,
  searchTerm,
  onClear
}: {
  type: 'categories' | 'items'
  searchTerm?: string
  onClear?: () => void
}) {
  const Icon = type === 'categories' ? FolderOpen : Coffee
  const title = type === 'categories' ? 'No Categories Found' : 'No Menu Items Found'
  const message = searchTerm
    ? `No ${type} matching "${searchTerm}"`
    : type === 'categories'
      ? 'This category doesn\'t have any subcategories yet.'
      : 'This category doesn\'t have any menu items yet.'

  return (
    <div className="text-center py-12 col-span-full">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-muted rounded-full">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{message}</p>
      {searchTerm && onClear && (
        <Button
          variant="link"
          onClick={onClear}
          className="mt-2"
        >
          Clear search
        </Button>
      )}
    </div>
  )
})

// Scrollable Section Component
const ScrollableSection = memo(function ScrollableSection({
  title,
  count,
  children,
  className = ""
}: {
  title: string
  count: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-4 sticky top-0 bg-background z-10 py-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Badge variant="outline">{count}</Badge>
      </div>
      <ScrollArea className="h-[calc(100vh-300px)] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {children}
        </div>
      </ScrollArea>
    </section>
  )
})

// Main Category Display Component
const CategoryDisplay = memo(function CategoryDisplay({
  category,
  slugs,
}: {
  category: CategoryData
  slugs: string[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

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

  const handleClearSearch = () => {
    setSearchTerm('')
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation items={category.breadcrumb} />

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
            <ScrollableSection title="Subcategories" count={filteredCategories.length}>
              {filteredCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </ScrollableSection>
          )}

          {/* Menu Items Section */}
          {hasMenuItems && (
            <ScrollableSection title="Menu Items" count={filteredMenuItems.length}>
              {filteredMenuItems
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    categoryName={currentCategoryName}
                  />
                ))}
            </ScrollableSection>
          )}

          {/* Empty State for All tab */}
          {!hasCategories && !hasMenuItems && (
            <EmptyState type="items" searchTerm={searchTerm} onClear={handleClearSearch} />
          )}
        </TabsContent>

        {/* Categories Only Tab */}
        <TabsContent value="categories">
          {hasCategories ? (
            <ScrollableSection title="Subcategories" count={filteredCategories.length}>
              {filteredCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </ScrollableSection>
          ) : (
            <EmptyState type="categories" searchTerm={searchTerm} onClear={handleClearSearch} />
          )}
        </TabsContent>

        {/* Menu Items Only Tab */}
        <TabsContent value="items">
          {hasMenuItems ? (
            <ScrollableSection title="Menu Items" count={filteredMenuItems.length}>
              {filteredMenuItems
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    categoryName={currentCategoryName}
                  />
                ))}
            </ScrollableSection>
          ) : (
            <EmptyState type="items" searchTerm={searchTerm} onClear={handleClearSearch} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
})

// Main Component
function FoodCategoryBySlug({ slugs }: { slugs: string[] }) {
  const slugString = slugs.join('/')
  const { data, isLoading, isError, refetch, isFetching } = useGetFoodCategoriesBySlug(
    slugString,
  ) as {
    data: CategoryData | undefined
    isLoading: boolean
    isError: boolean
    refetch: () => void
    isFetching: boolean
  }

  const canAddCatNMenu = slugs.length <= 5
  const parentId = useMemo(() => {
    if (isLoading) return null;
    if (!data) return null;
    return data?.breadcrumb?.length ? data.breadcrumb[data.breadcrumb.length - 1].id : null;
  }, [isLoading, data?.breadcrumb])

  if (!slugString) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No category slug found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {canAddCatNMenu && (
          <AddCategoryNMenuPage slugs={slugs} parentId={parentId} />
        )}

        {/* Main content */}
        {isLoading ? (
          <CategoryLoadingSkeleton />
        ) : isError ? (
          <ErrorState onRefresh={refetch} />
        ) : data ? (
          <CategoryDisplay category={data} slugs={slugs} />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No category data available</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default FoodCategoryBySlug