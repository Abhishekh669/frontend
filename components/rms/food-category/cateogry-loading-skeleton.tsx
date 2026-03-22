'use client'

import { memo } from 'react'

// ── Category card skeletons ────────────────────────────────────────────────
export const CategoryCardSkeleton = memo(function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-pulse">
      <div className="p-5 space-y-4">
        {/* Badge + title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 rounded bg-muted mt-0.5" />
            <div className="w-28 h-4 rounded-full bg-muted" />
          </div>
          <div className="w-14 h-5 rounded-full bg-muted" />
        </div>
        {/* Slug pill */}
        <div className="w-20 h-5 rounded-lg bg-muted" />
        {/* Order */}
        <div className="w-16 h-3 rounded-full bg-muted" />
        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <div className="flex-1 h-8 rounded-xl bg-muted" />
          <div className="flex-1 h-8 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
})

export const CategoryGridSkeleton = memo(function CategoryGridSkeleton({
  count = 8
}: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
})

// ── Table row skeletons ────────────────────────────────────────────────────
export const MenuItemRowSkeleton = memo(function MenuItemRowSkeleton() {
  return (
    <tr className="border-b border-border animate-pulse">
      {/* Checkbox */}
      <td className="px-4 py-3">
        <div className="w-4 h-4 rounded bg-muted" />
      </td>
      {/* Image */}
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <div className="w-32 h-4 rounded-full bg-muted" />
      </td>
      {/* Category */}
      <td className="px-4 py-3">
        <div className="w-24 h-4 rounded-full bg-muted" />
      </td>
      {/* Price */}
      <td className="px-4 py-3">
        <div className="w-16 h-4 rounded-full bg-muted" />
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <div className="w-20 h-5 rounded-full bg-muted" />
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="w-8 h-8 rounded-lg bg-muted" />
        </div>
      </td>
    </tr>
  )
})

export const MenuItemTableSkeleton = memo(function MenuItemTableSkeleton({
  rows = 5
}: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 w-10" />
            {['Image', 'Name', 'Category', 'Price', 'Status', 'Actions'].map((col) => (
              <th key={col} className="px-4 py-3">
                <div className="w-14 h-3 rounded-full bg-muted animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <MenuItemRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
})

// ── Page-level skeleton ────────────────────────────────────────────────────
export const FoodCategoryPageSkeleton = memo(function FoodCategoryPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero card skeleton */}
      <div className="rounded-3xl border border-border bg-card px-8 py-8 shadow-sm animate-pulse">
        <div className="space-y-3">
          <div className="w-24 h-3 rounded-full bg-muted" />
          <div className="w-56 h-7 rounded-full bg-muted" />
          <div className="w-80 h-4 rounded-full bg-muted" />
        </div>
      </div>

      {/* Toolbar skeleton */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-24 h-9 rounded-xl bg-muted" />
          <div className="flex-1 h-9 rounded-xl bg-muted" />
          <div className="w-36 h-9 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Grid skeleton */}
      <CategoryGridSkeleton count={8} />
    </div>
  )
})

// ── Slug page skeleton (table view) ───────────────────────────────────────
export const SlugPageSkeleton = memo(function SlugPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Add items bar skeleton */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted" />
            <div className="space-y-1.5">
              <div className="w-32 h-4 rounded-full bg-muted" />
              <div className="w-48 h-3 rounded-full bg-muted" />
            </div>
          </div>
          <div className="w-32 h-9 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Table skeleton */}
      <MenuItemTableSkeleton rows={6} />
    </div>
  )
})

export default FoodCategoryPageSkeleton