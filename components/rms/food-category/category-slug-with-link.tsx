"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight, LayoutGrid } from "lucide-react"

function formatSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function CategoryHeaderWithSlug({ slugs }: { slugs: string[] }) {
  const isRoot = !slugs || slugs.length === 0

  return (
    <div className="relative mb-8">
      {/* Main Heading - Always Food Category */}
      <div className="mb-3 flex items-baseline gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Food Category
        </h1>
        {!isRoot && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / {formatSlug(slugs[slugs.length - 1])}
          </span>
        )}
      </div>

      {/* Decorative gradient line */}
      <div className="absolute -top-1 left-0 h-1 w-20 rounded-full bg-linear-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400" />
      
      <div className="mt-4 flex flex-col space-y-3">
        {/* Breadcrumb - Clean styling */}
        <nav 
          className="flex items-center text-sm" 
          aria-label="Breadcrumb"
        >
          <div className="flex items-center">
            <Link
              href="/food-category"
              className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">All Categories</span>
              <span className="sm:hidden">All</span>
            </Link>

            {slugs?.map((slug, index) => {
              const href = "/food-category/" + slugs.slice(0, index + 1).join("/")
              const isLast = index === slugs.length - 1
              const formattedSlug = formatSlug(slug)

              return (
                <React.Fragment key={index}>
                  <ChevronRight className="mx-2 h-3.5 w-3.5 text-gray-400 dark:text-gray-600" />
                  
                  {isLast ? (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      <span className="max-w-50 truncate sm:max-w-xs">
                        {formattedSlug}
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="text-gray-600 transition-colors hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
                    >
                      <span className="max-w-37.5 truncate sm:max-w-xs">
                        {formattedSlug}
                      </span>
                    </Link>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </nav>

        {/* Subtle description for root category */}
        {isRoot && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Explore our delicious collection of recipes and culinary inspiration
          </p>
        )}
      </div>
    </div>
  )
}

export default CategoryHeaderWithSlug