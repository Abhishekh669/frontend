'use client'

import { memo, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useGetFoodCategoriesBySlug } from '@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-by-slug'
import NewMenuItemsPage from './new-menu-item-lists'
import AddMenuItems from './new-add-menu-items'

interface MenuItemsBySlugProps {
  slug: string
}

function MenuItemsBySlug({ slug }: MenuItemsBySlugProps) {
  console.log("this is slugs i nslugs : ", slug)
  const { data, isLoading, isError, refetch } = useGetFoodCategoriesBySlug(slug) 

  console.log("thisi sthe food by slug : ", data)
  const menu_items = data?.menu_items || []
  


  if (!slug) {
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
        <AddMenuItems slug={slug}/>
       <NewMenuItemsPage menuItems={menu_items} slugs={slug}  />

      </div>
    </div>
  )
}

export default memo(MenuItemsBySlug)