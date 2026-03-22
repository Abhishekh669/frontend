'use client'

import { memo } from 'react'
import { AlertCircle } from 'lucide-react'
import { useGetFoodCategoriesBySlug } from '@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-by-slug'
import NewMenuItemsPage from './new-menu-item-lists'

interface FoodCategoryBySlugProps {
  slug: string
}

function FoodCategoryBySlug({ slug }: FoodCategoryBySlugProps) {
  console.log("this is slugs i nslugs : ", slug)
  const { data, isLoading, isError, refetch } = useGetFoodCategoriesBySlug(slug)

  console.log("thisi sthe food by slug : ", data)
  const menu_items = data?.menu_items || []

  if (!slug) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Error</p>
          <p className="text-xs text-muted-foreground">No category slug found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Content area */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reserved for future content */}
      </div>
    </div>
  )
}

export default memo(FoodCategoryBySlug)