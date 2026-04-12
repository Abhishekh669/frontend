import CategoryHeaderWithSlug from "@/components/rms/food-category/category-slug-with-link"
import { getUserFromTokenAction } from "@/utils/actions/user/user.get.action";
import { hasPermission } from "@/utils/helper/check-permission";
import { FoodCategoryManagementAction } from "@/utils/rbac/role-n-permissiona";
import { User } from "@/utils/types/user.types";
import React, { Suspense } from "react"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug?: string }>
}

export default async function Layout({ children, params }: LayoutProps) {
  const data = await getUserFromTokenAction();
  if (!data.data) {
    return null;
  }
  const user = data.data as User
  if (!hasPermission(user.role, FoodCategoryManagementAction.VIEW_CATEGORY)) {
    return null;
  }
  return (
    <Suspense fallback={<div>Loading category...</div>}>
      <div className="space-y-6 p-1">
        {children}
      </div>
    </Suspense>
  )
}
