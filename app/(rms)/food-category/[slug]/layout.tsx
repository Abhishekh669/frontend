import CategoryHeaderWithSlug from "@/components/rms/food-category/category-slug-with-link"
import React, { Suspense } from "react"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug?: string }>
}

export default async function Layout({ children, params }: LayoutProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug || ""
  console.log("this is params : ", resolvedParams.slug)


  return (
    <Suspense fallback={<div>Loading category...</div>}>
      <div className="space-y-6 p-1">
          
        {/* This shows on ALL slug routes */}
       

        {/* This changes based on slug */}
        {children}
        
      </div>
    </Suspense>
  )
}
