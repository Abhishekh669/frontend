'use client'

import { memo, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useGetFoodCategoriesBySlug } from '@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-by-slug'
import { CategoryData } from '@/utils/types/food-category.types'
import AddCategoryNMenuPage from './add-category-n-menu'
import { CategoryLoadingSkeleton } from './cateogry-loading-skeleton'
import { ErrorState } from './error-state'
import { CategoryDisplay } from './category-section'

interface FoodCategoryBySlugProps {
  slugs: string[]
}

function FoodCategoryBySlug({ slugs }: FoodCategoryBySlugProps) {
  console.log("this is slugs : ", slugs)
  const slugString = slugs.join('/')
  const { data, isLoading, isError, refetch } = useGetFoodCategoriesBySlug(slugString) as {
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
          <CategoryDisplay
            category={data}
            slugs={slugs}
            refetch={refetch}
          />
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

export default memo(FoodCategoryBySlug)