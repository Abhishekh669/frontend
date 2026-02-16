'use client'

import { memo } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Category } from '@/utils/types/food-category.types'

interface BreadcrumbNavigationProps {
  items: Category[]
}

export const BreadcrumbNavigation = memo(function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
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
                <BreadcrumbPage className="capitalize">{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/food-category/${item.slug}`} className="capitalize">
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